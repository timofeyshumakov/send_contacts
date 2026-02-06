export async function callApi(method: string, filter: {}, select: string[] | null, entityTypeId: number | null, batchNumber: number, parsed: number): Promise<any[]> {
    let total: number = 0;
    const maxTotal: number = 50;
    let data: any = [];

    // Проверяем, содержит ли filter массив ID
    const filterHasIdArray = filter && typeof filter === 'object' && 'ID' in filter && Array.isArray((filter as any).ID);
    const idArray = filterHasIdArray ? (filter as any).ID : [];
    
    // Если filter содержит массив ID и их больше 50, обрабатываем через batch
    if (filterHasIdArray && idArray.length > maxTotal) {
        console.log(`Обработка ${idArray.length} ID через batch запросы`);
        let resultData: any[] = [];
        const totalBatches = Math.ceil(idArray.length / maxTotal);
        
        // Создаем batch команды
        let batchCommands: any = {};
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIndex = batchIndex * maxTotal;
            const endIndex = Math.min(startIndex + maxTotal, idArray.length);
            const batchIds = idArray.slice(startIndex, endIndex);
            
            // Создаем новый filter с текущей партией ID
            const batchFilter = {
                ...filter,
                ID: batchIds
            };
            
            let batchParams: any = {};
            
            if (method === "task.elapseditem.getlist") {
                batchParams = {
                    ORDER: { 'TASK_ID': 'desc' },
                    FILTER: batchFilter,
                    SELECT: select || [],
                };
            } else if (method === "lists.element.get") {
                // Параметры для lists.element.get
                batchParams = {
                    IBLOCK_TYPE_ID: 'lists',
                    IBLOCK_ID: entityTypeId || 47,
                    FILTER: batchFilter,
                    SELECT: select || ['ID', 'NAME'],
                };
            } else {
                batchParams = {
                    filter: batchFilter,
                    select: select || null,
                    entityTypeId: entityTypeId || null,
                    id: method === "crm.dealcategory.stage.list" ? entityTypeId : null,
                    start: 0,
                };
            }
            
            const key = `cmd${batchIndex}`;
            batchCommands[key] = {
                method: method,
                params: batchParams
            };
        }
        
        // Выполняем batch запрос
        await new Promise((resolve) => {
            // @ts-ignore
            BX24.callBatch(batchCommands, (res: any) => {
                for (let i = 0; i < totalBatches; i++) {
                    const key = `cmd${i}`;
                    if (res[key] && !res[key].error()) {
                        const batchData = res[key].data();
                        const processedData = batchData.items ? batchData.items : batchData;
                        resultData.push(processedData);
                    } else if (res[key] && res[key].error()) {
                        console.error(`Ошибка в batch команде ${key}:`, res[key].error());
                    }
                }
                data = resultData;
                resolve(data);
            });
        });
        console.log(data);
        return data.items ? data.items : data;
    }
    
    // Определяем параметры в зависимости от метода
    let params: any = {};

    if (method === "task.elapseditem.getlist" && !Array.isArray(entityTypeId)) {
        // Специфичные параметры для task.elapseditem.getlist
        params = {
            ORDER: { 'TASK_ID': 'desc' },
            FILTER: filter,
            SELECT: select || [],
            start: 0
        };
    } else if (method === "lists.element.get") {
        // Параметры для lists.element.get с пагинацией
        params = {
            IBLOCK_TYPE_ID: 'lists',
            IBLOCK_ID: entityTypeId || 47,
            FILTER: filter || {},
            SELECT: select || ['ID', 'NAME'],
            start: 0,
        };
    } else {
        // Стандартные параметры для других методов
        params = {
            filter: filter ? filter : null,
            select: select ? select : null,
            entityTypeId: entityTypeId ? entityTypeId : null,
            id: method === "crm.dealcategory.stage.list" ? entityTypeId : null,
            start: 0,
        };
    }

    const exceptions: string[] = ["crm.status.list"];
    
    // Обычная обработка для случаев без массива ID или с малым количеством ID
    if(!Array.isArray(entityTypeId)){
        await new Promise((resolve) => {
            // @ts-ignore
            BX24.callMethod(method, params, (res: any) => {
                if (res.data()) {
                    total = res.total();
                    data = res.data();
                    parsed += total;
                    resolve(data);
                }
            });
        });
    }

    // Проверяем, нужно ли загружать дополнительные данные через batch
    if ((total > maxTotal && !exceptions.includes(method)) || Array.isArray(entityTypeId)) {
        let cmd = {};
        let iterations: number = Math.min(Math.ceil((total - batchNumber * 2500) / maxTotal), 50);
        
        // Для lists.element.get вычисляем количество итераций для пагинации
        if (method === "lists.element.get" && total > maxTotal) {
            iterations = Math.min(Math.ceil(total / maxTotal), 50);
        }
        
        if(iterations === 0){
          iterations = entityTypeId?.length || 0;
        }
        
        let resultData: any[] = [];

        for (let i: number = 0; i < iterations; i++) {
            const key: string = `cmd${i}`;
            
            let batchParams: any = {};
            
            if (method === "task.elapseditem.getlist") {
                batchParams = {
                    ORDER: { 'TASK_ID': 'desc' },
                    FILTER: filter,
                    SELECT: select || [],
                    NAV_PARAMS: {NAV_PARAMS: {
                            "nPageSize": 50,
                            "iNumPage": i + 1,
                        }
                    }
                };
                
                if(entityTypeId && entityTypeId.length > 0){
                    batchParams.TASKID = entityTypeId[i];
                }
            } else if (method === "lists.element.get") {
                // Параметры для lists.element.get в batch с пагинацией через start
                batchParams = {
                    IBLOCK_TYPE_ID: 'lists',
                    IBLOCK_ID: entityTypeId || 47,
                    FILTER: filter || {},
                    SELECT: select || ['ID', 'NAME'],
                    start: i * maxTotal,  // Увеличиваем start для каждой страницы
                };
            } else {
                batchParams = {
                    filter: filter || null,
                    select: select || null,
                    entityTypeId: entityTypeId || null,
                    id: method === "crm.dealcategory.stage.list" ? entityTypeId : null,
                    start: (batchNumber * 2500) + i * maxTotal,
                };
            }

            const value = {
                method: method,
                params: batchParams,
            };
            
            cmd[key] = value;
            
            if ((i + 1) % maxTotal === 0 || i + 1 === iterations) {
                console.log(cmd);
                const batchLength: number = (i + 1) % maxTotal === 0 ? maxTotal : iterations % maxTotal;
                
                await new Promise((resolve: any) => {
                    // @ts-ignore
                    BX24.callBatch(cmd, (res: any) => {
                        for (let r: number = i - batchLength + 1; r < i + 1; r++) {
                            const key: string = `cmd${r}`;
                            if (res[key] && !res[key].error()) {
                                const batchData = res[key].data();
                                const processedData = batchData.items ? batchData.items : batchData;
                                resultData.push(processedData);
                            } else if (res[key] && res[key].error()) {
                                console.error(`Ошибка в batch команде ${key}:`, res[key].error());
                            }
                        }
                        if(!Array.isArray(entityTypeId)){
                            resultData = resultData.flat();
                        }
                        
                        data = resultData;
                        cmd = {};
                        resolve();
                    });
                });
                
                break;
            }
        }
    }
    
    return data.items ? data.items : data;
}

// Пример использования нового метода
export async function getTaskElapsedItems(filter: object = {}, select: string[] = [], taskId: any): Promise<any[]> {
    console.log(filter, select, taskId);
    return callApi('task.elapseditem.getlist', filter, select, taskId, 0, 0);
}

// Новая функция для получения элементов списка с поддержкой полной загрузки
export async function getListElements(
    iblockId: number = 0, 
    filter: object = {}, 
    select: string[] = ['ID', 'NAME']
): Promise<any[]> {
    return callApi('lists.element.get', filter, select, iblockId, 0, 0);
}

// Новая функция для открепления контактов от компании
export async function detachContacts(
    companyId: string | number,
    contactIds: string[] | number[]
): Promise<{ success: boolean; processed: number; errors: string[] }> {
    try {
        console.log(`Открепление ${contactIds.length} контактов от компании ${companyId}`);
        
        // Если нет контактов для открепления
        if (!contactIds || contactIds.length === 0) {
            return { success: true, processed: 0, errors: [] };
        }
        
        // Конвертируем ID в строки для безопасности
        const stringContactIds = contactIds.map(id => String(id));
        const stringCompanyId = String(companyId);
        
        // Если только один контакт - используем обычный вызов
        if (stringContactIds.length === 1) {
            return new Promise((resolve) => {
                BX24.callMethod(
                    "crm.company.contact.delete",
                    {
                        id: stringCompanyId,
                        fields: {
                            CONTACT_ID: stringContactIds[0]
                        }
                    },
                    (res: any) => {
                        if (res.error()) {
                            console.error('Ошибка открепления контакта:', res.error());
                            resolve({
                                success: false,
                                processed: 0,
                                errors: [res.error().toString()]
                            });
                        } else {
                            console.log('Контакт успешно откреплен');
                            resolve({
                                success: true,
                                processed: 1,
                                errors: []
                            });
                        }
                    }
                );
            });
        }
        
        // Для нескольких контактов используем batch
        const batchCommands: any = {};
        const batchSize = 50; // Максимальное количество команд в batch
        
        // Создаем batch команды
        for (let i = 0; i < stringContactIds.length; i++) {
            const key = `cmd${i}`;
            batchCommands[key] = {
                method: "crm.company.contact.delete",
                params: {
                    id: stringCompanyId,
                    fields: {
                        CONTACT_ID: stringContactIds[i]
                    }
                }
            };
            
            // Если достигли максимума команд или это последний контакт
            if ((i + 1) % batchSize === 0 || i === stringContactIds.length - 1) {
                // Выполняем текущий batch
                const batchResult = await new Promise<{ processed: number; errors: string[] }>((resolve) => {
                    BX24.callBatch(batchCommands, (res: any) => {
                        let processed = 0;
                        const errors: string[] = [];
                        
                        // Проверяем результаты каждой команды в batch
                        Object.keys(batchCommands).forEach(cmdKey => {
                            if (res[cmdKey] && !res[cmdKey].error()) {
                                processed++;
                            } else if (res[cmdKey] && res[cmdKey].error()) {
                                const errorMsg = `Ошибка открепления контакта: ${res[cmdKey].error()}`;
                                console.error(errorMsg);
                                errors.push(errorMsg);
                            }
                        });
                        
                        resolve({ processed, errors });
                    });
                });
                
                // Если были ошибки в batch, возвращаем результат с ошибками
                if (batchResult.errors.length > 0) {
                    return {
                        success: false,
                        processed: batchResult.processed,
                        errors: batchResult.errors
                    };
                }
                
                // Очищаем команды для следующего batch
                Object.keys(batchCommands).forEach(key => delete batchCommands[key]);
            }
        }
        
        // Если мы здесь, значит все batch выполнились успешно
        return {
            success: true,
            processed: stringContactIds.length,
            errors: []
        };
        
    } catch (error) {
        console.error('Критическая ошибка при откреплении контактов:', error);
        return {
            success: false,
            processed: 0,
            errors: [error instanceof Error ? error.message : String(error)]
        };
    }
}

// Альтернативная версия для единообразного интерфейса с callApi
export async function callApiExtended(
    method: string, 
    params: any
): Promise<any> {
    return new Promise((resolve, reject) => {
        BX24.callMethod(method, params, (res: any) => {
            if (res.error()) {
                reject(res.error());
            } else {
                resolve(res.data());
            }
        });
    });
}

// Функция для открепления контактов с использованием callApiExtended
export async function detachContactsV2(
    companyId: string | number,
    contactIds: string[] | number[]
): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const stringContactIds = contactIds.map(id => String(id));
    const stringCompanyId = String(companyId);
    const results: Array<{ success: boolean; error?: string }> = [];
    
    // Создаем промисы для каждого контакта
    const promises = stringContactIds.map(contactId => {
        return callApiExtended("crm.company.contact.delete", {
            id: stringCompanyId,
            fields: {
                CONTACT_ID: contactId
            }
        })
        .then(() => ({ success: true }))
        .catch((error: any) => ({ 
            success: false, 
            error: error.toString() 
        }));
    });
    
    // Ждем выполнения всех промисов
    const allResults = await Promise.allSettled(promises);
    
    // Обрабатываем результаты
    allResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            results.push(result.value);
        } else {
            results.push({ 
                success: false, 
                error: `Promise rejected: ${result.reason}` 
            });
        }
    });
    
    // Считаем статистику
    const processed = results.filter(r => r.success).length;
    const errors = results
        .filter(r => !r.success && r.error)
        .map(r => r.error!);
    
    return {
        success: errors.length === 0,
        processed,
        errors
    };
}