<template>
  <div v-if="loading"></div>
  <div v-else>
    <!-- Компонент загрузчика -->
    <LoadingSpinner :visible="detachLoading" :text="detachLoadingText" />
    
    <!-- Верхний блок с фильтром и кнопкой -->
    <v-card class="mb-4 elevation-1">
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between">
          <!-- Фильтр по целевой аудитории -->
          <v-select
            v-model="selectedAudienceFilter"
            :items="audienceFilterOptions"
            item-text="title"
            item-value="id"
            label="Фильтр по целевой аудитории"
            variant="outlined"
            dense
            clearable
            class="mr-4"
            style="max-width: 400px;"
            @update:modelValue="scrollToAudience"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :title="item.raw.title"
              ></v-list-item>
            </template>
          </v-select>
          
          <!-- Кнопка добавления контакта -->
          <v-btn 
            color="primary" 
            @click="openCreateDialog"
            :disabled="detachLoading"
            prepend-icon="mdi-plus"
            class="ml-auto"
          >
            Добавить контакт
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Диалог редактирования контакта -->
    <v-dialog v-model="editDialog" max-width="600px" persistent>
      <v-card>
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="editContactData.FULL_NAME"
                label="ФИО"
                variant="outlined"
                dense
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="editContactData.POST"
                label="Должность"
                variant="outlined"
                dense
                clearable
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-select
                v-model="editContactData.UF_CRM_1753083765"
                :items="cityOptions"
                item-text="title"
                item-value="id"
                label="Город"
                variant="outlined"
                dense
                clearable
                :loading="citiesLoading"
              ></v-select>
            </v-col>
            
            <v-col cols="12">
              <v-select
                v-model="editContactData.UF_CRM_1753364801"
                :items="audienceOptions"
                item-text="title"
                item-value="id"
                label="Целевые аудитории"
                multiple
                chips
                variant="outlined"
                dense
                clearable
              ></v-select>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="editContactData.emailValue"
                label="Email"
                variant="outlined"
                dense
                clearable
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="editContactData.phoneValue"
                label="Телефон"
                variant="outlined"
                dense
                clearable
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey" 
            text 
            @click="cancelEdit"
            :disabled="saveLoading"
          >
            <v-icon left>mdi-close</v-icon>
            Отменить
          </v-btn>
          <v-btn 
            color="primary" 
            @click="saveEdit"
            :loading="saveLoading"
            :disabled="saveLoading"
          >
            <v-icon left>mdi-check</v-icon>
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог создания контакта -->
    <v-dialog v-model="createDialog" max-width="600px" persistent>
      <v-card>
        <v-card-text class="pa-4">
          <!-- Сообщения о дубликатах -->
          <v-alert
            v-if="duplicateMessages.length > 0"
            type="warning"
            density="compact"
            class="mb-4"
          >
            <div v-for="(message, index) in duplicateMessages" :key="index" class="mb-1">
              {{ message.message }}
              <a 
                v-if="message.contactId" 
                :href="'https://' + domain + '/crm/contact/details/' + message.contactId + '/'" 
                target="_blank"
                class="ml-1 text-decoration-underline white"
                @click.stop
              >
                {{message.contactName}}
              </a>
            </div>
          </v-alert>
          
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="newContactData.FULL_NAME"
                label="ФИО *"
                variant="outlined"
                dense
                required
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="newContactData.POST"
                label="Должность"
                variant="outlined"
                dense
                clearable
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-select
                v-model="newContactData.UF_CRM_1753083765"
                :items="cityOptions"
                item-text="title"
                item-value="id"
                label="Город"
                variant="outlined"
                dense
                clearable
                :loading="citiesLoading"
              ></v-select>
            </v-col>
            
            <v-col cols="12">
              <v-select
                v-model="newContactData.UF_CRM_1753364801"
                :items="audienceOptions"
                item-text="title"
                item-value="id"
                label="Целевые аудитории"
                multiple
                chips
                variant="outlined"
                dense
                clearable
              ></v-select>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="newContactData.emailValue"
                label="Email"
                variant="outlined"
                dense
                clearable
                @input="checkDuplicates"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="newContactData.phoneValue"
                label="Телефон"
                variant="outlined"
                dense
                clearable
                @input="checkDuplicates"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey" 
            text 
            @click="cancelCreate"
            :disabled="createLoading"
          >
            <v-icon left>mdi-close</v-icon>
            Отменить
          </v-btn>
          <v-btn 
            color="primary" 
            @click="createContact"
            :loading="createLoading"
            :disabled="createLoading"
          >
            <v-icon left>mdi-plus</v-icon>
            Создать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Блок по целевым аудиториям -->
    <v-card 
      class="mb-3 elevation-1"
      v-for="(audience, audienceName) in filteredGroupedByAudience"
      :key="audienceName"
      :id="'audience-' + audienceName.replace(/\s+/g, '-')"
    >
      <v-card-title class="secondary white--text">
        {{ audienceTitles.get(audienceName) || audienceName }}
      </v-card-title>
      <v-list rounded>
        <template v-for="(contact, index) in audience" :key="contact.ID">
          <v-list-item @click="editContact(contact)" class="contact-item">
            <v-list-item-content>
              <v-list-item-title class="text-h6 font-weight-bold primary--text">
                <a class="name" target="_blank" :href="'https://' + domain + '/crm/contact/details/' + contact.ID + '/'">{{ contact.FULL_NAME }}</a>
                <!-- Кнопка ключевого лица -->
                <v-btn 
                  v-if="enityId === 'CRM_DEAL_DETAIL_TAB'" 
                  class="key-person-btn mr-2" 
                  :color="isKeyPerson(contact.ID) ? 'success' : 'grey-lighten-2'" 
                  icon 
                  @click.stop="toggleKeyPerson(contact.ID)"
                  :disabled="detachLoading"
                  aria-label="Ключевое лицо" 
                  title="Ключевое лицо"
                  size="x-small"
                >
                  <v-icon v-if="isKeyPerson(contact.ID)" size="small">mdi-check</v-icon>
                  <v-icon v-else size="small" style="opacity: 0.5">mdi-account</v-icon>
                </v-btn>
                <!-- Крестик для открепления контакта -->
                <v-btn 
                  class="delete-btn mr-2" 
                  icon 
                  @click.stop="detachContact(contact.ID)"
                  :disabled="detachLoading"
                  aria-label="Открепить контакт" 
                  title="Открепить контакт"
                  size="x-small"
                >
                  ❌
                </v-btn>
                <!-- Метка исключения из рассылки -->
                <span v-if="isExcludedFromMailing(contact.ID)" class="excluded-label ml-2">
                  (Исключен из рассылки)
                </span>
              </v-list-item-title>
              
              <!-- Поле целевых аудиторий контакта -->
              <v-list-item-subtitle class="text-subtitle-1">
                Целевые аудитории: 
                <span v-if="getContactAudienceTitles(contact).length > 0">
                  {{ getContactAudienceTitles(contact).join(', ') }}
                </span>
                <span v-else style="color: #999; font-style: italic;">
                  не указаны
                </span>
              </v-list-item-subtitle>
              
              <v-list-item-subtitle class="text-subtitle-1">
                Должность: {{ contact.POST || '-' }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-subtitle-1">
                Город: {{ cityTitles.get(String(contact.UF_CRM_1753083765)) || contact.UF_CRM_1753083765 || '-' }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-subtitle-1">
                Email: {{ contact.EMAIL && contact.EMAIL[0] ? contact.EMAIL[0].VALUE : '-' }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-subtitle-1">
                Телефон: {{ contact.PHONE && contact.PHONE[0] ? contact.PHONE[0].VALUE : '-' }}
              </v-list-item-subtitle>
              <v-list dense>
                <v-list-item 
                  v-for="(medication, m) in contact.medications" 
                  :key="m"
                  class="pl-0"
                >
                  <v-list-item-content>
                    <div class="d-flex align-center ga-2">
                      <span class="font-weight-medium medication">
                        <a target="_blank" :href="'https://' + domain + '/page/spravochniki/pgirfw/type/189/details/' + contact.UF_CRM_1750766630[m] + '/'">{{ medication}}</a>
                      </span>
                      <span class="font-weight-medium"> - </span>
                      <span class="text--darken-1">
                        {{ contact.directions[m].join(', ') }}
                      </span>
                    </div>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-list-item-content>
          </v-list-item>
          <v-divider v-if="index < audience.length - 1" :key="`divider-audience-${audienceName}-${index}`"></v-divider>
        </template>
      </v-list>
      <v-divider></v-divider>
      <!-- Список препаратов для данной аудитории -->
      <v-list-item-subtitle class="item" v-if="filteredAudienceMedications[audienceName] && filteredAudienceMedications[audienceName].length > 0">
        <span>Препараты: </span>
        <a
          v-for="(medication, m) in filteredAudienceMedications[audienceName]" 
          :key="`med-${m}`"
          target="_blank" :href="'https://' + domain + '/page/spravochniki/pgirfw/type/189/details/' + medication.id + '/'" 
        >{{ filteredAudienceMedications[audienceName].length !== m + 1 ? medication.title + ", " : medication.title }}</a>
      </v-list-item-subtitle>
      <!-- Список оборудования для данной аудитории -->
      <v-list-item-subtitle class="item" v-if="filteredAudienceEquipment[audienceName] && filteredAudienceEquipment[audienceName].length > 0">
        <span>Оборудование: </span>
        <a
          v-for="(equipment, e) in filteredAudienceEquipment[audienceName]" 
          :key="`equip-${e}`"
          class="pl-0"
          target="_blank" :href="'https://' + domain + '/crm/type/1104/details/' + equipment.id + '/'" 
        >{{ filteredAudienceEquipment[audienceName].length !== e + 1 ? equipment.title + ", " : equipment.title}}</a>
      </v-list-item-subtitle>
    </v-card>

    <!-- Блок Другие (контакты без целевой аудитории) -->
    <v-card 
      class="mb-3 elevation-1"
      v-if="contactsWithoutAudience.length > 0"
      id="no-audience-block"
    >
      <v-card-title class="secondary white--text">
        Другие
      </v-card-title>
      <v-list rounded>
        <template v-for="(contact, index) in contactsWithoutAudience" :key="contact.ID">
          <v-list-item @click="editContact(contact)" class="contact-item">
            <v-list-item-content>
              <v-list-item-title class="text-h6 font-weight-bold primary--text">
                <a class="name" target="_blank" :href="'https://' + domain + '/crm/contact/details/' + contact.ID + '/'">{{ contact.FULL_NAME }}</a>
                
                <!-- Крестик для открепления контакта -->
                <v-btn 
                  class="delete-btn mr-2" 
                  icon 
                  @click.stop="detachContact(contact.ID)"
                  :disabled="detachLoading"
                  aria-label="Открепить контакт" 
                  title="Открепить контакт"
                  size="x-small"
                >
                  ❌
                </v-btn>
                
                <!-- Кнопка ключевого лица -->
                <v-btn 
                  v-if="enityId === 'CRM_DEAL_DETAIL_TAB'" 
                  class="key-person-btn mr-2" 
                  :color="isKeyPerson(contact.ID) ? 'success' : 'grey-lighten-2'" 
                  icon 
                  @click.stop="toggleKeyPerson(contact.ID)"
                  :disabled="detachLoading"
                  aria-label="Ключевое лицо" 
                  title="Ключевое лицо"
                  size="x-small"
                >
                  <v-icon v-if="isKeyPerson(contact.ID)" size="small">mdi-check</v-icon>
                  <v-icon v-else size="small" style="opacity: 0.5">mdi-account</v-icon>
                </v-btn>
                
                <!-- Метка исключения из рассылки -->
                <span v-if="isExcludedFromMailing(contact.ID)" class="excluded-label ml-2">
                  (Исключен из рассылки)
                </span>
              </v-list-item-title>
              
              <!-- Поле целевых аудиторий контакта -->
              <v-list-item-subtitle class="text-subtitle-1">
                Целевые аудитории: 
                <span v-if="getContactAudienceTitles(contact).length > 0">
                  {{ getContactAudienceTitles(contact).join(', ') }}
                </span>
                <span v-else style="color: #999; font-style: italic;">
                  не указаны
                </span>
              </v-list-item-subtitle>
              
              <v-list-item-subtitle class="text-subtitle-1">
                Должность: {{ contact.POST || '-' }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-subtitle-1">
                Email: {{ contact.EMAIL && contact.EMAIL[0] ? contact.EMAIL[0].VALUE : '-' }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-subtitle-1">
                Город: {{ cityTitles.get(String(contact.UF_CRM_1753083765)) || contact.UF_CRM_1753083765 || '-' }}
              </v-list-item-subtitle>
              <div>
                <div
                  v-for="(medication, m) in contact.medications" 
                  :key="m"
                  class="pl-0"
                >
                  <v-list-item-content>
                    <div class="d-flex align-center ga-2">
                      <span class="font-weight-medium medication">
                        <a target="_blank" :href="'https://' + domain + '/page/baza_preparatov/preparaty/type/189/details/' + contact.UF_CRM_1750766630[m] + '/'">{{ medication}}</a>
                      </span>
                      <span class="font-weight-medium"> - </span>
                      <span class="text--darken-1">
                        {{ contact.directions[m].join(', ') }}
                      </span>
                    </div>
                  </v-list-item-content>
                </div>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-divider v-if="index < contactsWithoutAudience.length - 1" :key="`divider-other-${index}`"></v-divider>
        </template>
      </v-list>
    </v-card>

    <!-- Блок аудиторий без контактов, но с препаратами или оборудованием -->
    <v-card 
      class="mb-3 elevation-1"
      v-for="(audience, audienceName) in audiencesWithoutContacts"
      :key="`no-contacts-${audienceName}`"
    >
      <v-card-title class="secondary white--text">
        {{ audienceTitles.get(audienceName) || audienceName }}
      </v-card-title>
      
      <!-- Список препаратов для данной аудитории -->
      <v-list-item-subtitle class="item" v-if="audience.medications && audience.medications.length > 0">
        <span>Препараты: </span>
        <a
          v-for="(medication, m) in audience.medications" 
          :key="`med-no-contacts-${m}`"
          target="_blank" :href="'https://' + domain + '/page/spravochniki/pgirfw/type/189/details/' + medication.id + '/'" 
        >{{ audience.medications.length !== m + 1 ? medication.title + ", " : medication.title }}</a>
      </v-list-item-subtitle>
      
      <!-- Список оборудования для данной аудитории -->
      <v-list-item-subtitle class="item" v-if="audience.equipment && audience.equipment.length > 0">
        <span>Оборудование: </span>
        <a
          v-for="(equipment, e) in audience.equipment" 
          :key="`equip-no-contacts-${e}`"
          class="pl-0"
          target="_blank" :href="'https://' + domain + '/crm/type/1104/details/' + equipment.id + '/'" 
        >{{ audience.equipment.length !== e + 1 ? equipment.title + ", " : equipment.title}}</a>
      </v-list-item-subtitle>
    </v-card>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive, nextTick } from 'vue';
import { callApi, getListElements, detachContacts } from "../functions/callApi";
import LoadingSpinner from '../components/LoadingSpinner.vue';

export default {
  components: {
    LoadingSpinner
  },
  setup() {
    const loading = ref(false);
    const detachLoading = ref(false);
    const detachLoadingText = ref('Открепление контакта...');
    const editDialog = ref(false);
    const saveLoading = ref(false);
    const citiesLoading = ref(false);
    const createDialog = ref(false);
    const createLoading = ref(false);
    const error = ref(null);
    const contacts = ref([]);
    const contactsIds = ref([]);
    const domain = ref('');
    const audienceTitles = ref(new Map());
    const cityTitles = ref(new Map());
    const products = ref([]);
    const equipment = ref([]);
    const companyId = ref(0);
    const dealId = ref(0);
    const enityId = ref("");
    const dealAudience = ref([]);
    const companyTargetAudience = ref(new Map());
    const keyPersons = ref([]);
    const selectedAudienceFilter = ref(null);
    const duplicateMessages = ref([]);
    const excludedContacts = ref(new Set()); // ID контактов, исключенных из рассылки
    const mailingEventId = ref(null); // ID мероприятия из поля сделки UF_CRM_1742797326

    // Данные для редактирования контакта
    const editContactData = reactive({
      ID: null,
      FULL_NAME: '',
      POST: '',
      UF_CRM_1753083765: null,
      UF_CRM_1753364801: [],
      emailValue: '',
      phoneValue: ''
    });

    // Данные для создания контакта
    const newContactData = reactive({
      FULL_NAME: '',
      POST: '',
      UF_CRM_1753083765: null,
      UF_CRM_1753364801: [],
      emailValue: '',
      phoneValue: ''
    });

    // Оригинальные данные для отмены изменений
    const originalContactData = reactive({
      ID: null,
      FULL_NAME: '',
      POST: '',
      UF_CRM_1753083765: null,
      UF_CRM_1753364801: [],
      emailValue: '',
      phoneValue: ''
    });

    // Функция для проверки исключения из рассылки
    const isExcludedFromMailing = (contactId) => {
      return excludedContacts.value.has(contactId);
    };

    // Функция для загрузки данных об исключенных контактах
    const fetchExcludedContacts = async () => {
      try {
        // Очищаем предыдущие данные
        excludedContacts.value.clear();
        
        if (!mailingEventId.value || mailingEventId.value === '') {
          console.log('ID мероприятия не найден');
          return;
        }
        
        console.log('Загрузка данных мероприятия с ID:', mailingEventId.value);
        
        // Загружаем данные мероприятия
        const eventData = await new Promise((resolve) => {
          BX24.callMethod(
            "crm.item.get",
            {
              id: mailingEventId.value,
              entityTypeId: 1052
            },
            function(result) {
              if (result.error()) {
                console.error('Ошибка загрузки данных мероприятия:', result.error());
                resolve({});
              } else {
                resolve(result.data());
              }
            }
          );
        });
        
        // Получаем строку с исключенными контактами
        const excludedString = eventData.item?.ufCrm38ExcludedContacts || '';
        
        if (excludedString) {
          // Преобразуем строку в массив ID и добавляем в Set
          const excludedIds = excludedString
            .split(',')
            .map(id => id.trim())
            .filter(id => id !== '')
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id));
          
          excludedIds.forEach(id => {
            excludedContacts.value.add(id);
          });
          
          console.log('Найдено исключенных контактов:', excludedIds.length);
        } else {
          console.log('Исключенные контакты не найдены в мероприятии');
        }
        
      } catch (error) {
        console.error('Ошибка при загрузке исключенных контактов:', error);
      }
    };

    // Опции для фильтра по аудиториям
    const audienceFilterOptions = computed(() => {
      const options = [];
      
      // Собираем все целевые аудитории из contacts
      const allAudienceIds = new Set();
      
      contacts.value.forEach(contact => {
        if (contact.UF_CRM_1753364801 && contact.UF_CRM_1753364801.length > 0) {
          contact.UF_CRM_1753364801.forEach(audienceId => {
            const audienceTitle = audienceTitles.value.get(String(audienceId)) || String(audienceId);
            if (audienceTitle && audienceTitle.trim() !== '' && !allAudienceIds.has(String(audienceId))) {
              allAudienceIds.add(String(audienceId));
              options.push({
                id: String(audienceId),
                title: audienceTitle
              });
            }
          });
        }
      });
      
      // Добавляем аудитории из audiencesWithoutContacts
      Object.keys(audiencesWithoutContacts.value).forEach(audienceTitle => {
        const audienceId = Array.from(audienceTitles.value.entries())
          .find(([id, title]) => title === audienceTitle)?.[0];
        
        if (audienceId && !allAudienceIds.has(audienceId)) {
          allAudienceIds.add(audienceId);
          options.push({
            id: audienceId,
            title: audienceTitle
          });
        }
      });
      
      // Добавляем "Другие" только если есть контакты без целевой аудитории
      if (contactsWithoutAudience.value.length > 0) {
        options.push({ 
          id: 'no-audience', 
          title: 'Другие' 
        });
      }
      
      return options.sort((a, b) => a.title.localeCompare(b.title));
    });

    // Опции для выбора аудиторий и городов
    const audienceOptions = computed(() => {
      const options = [];
      audienceTitles.value.forEach((title, id) => {
        if (title && title.trim() !== '') {
          options.push({
            id: String(id),
            title: title
          });
        }
      });
      return options;
    });

    const cityOptions = computed(() => {
      const options = [];
      cityTitles.value.forEach((title, id) => {
        if (title && title.trim() !== '') {
          options.push({
            id: String(id),
            title: title
          });
        }
      });
      return options;
    });

    // Функция для прокрутки к выбранной аудитории
    const scrollToAudience = async (audienceId) => {
      if (!audienceId) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      await nextTick();
      
      let element;
      
      if (audienceId === 'no-audience') {
        element = document.getElementById('no-audience-block');
      } else {
        const audienceTitle = audienceTitles.value.get(String(audienceId)) || audienceId;
        const elementId = `audience-${audienceTitle.replace(/\s+/g, '-')}`;
        element = document.getElementById(elementId);
      }
      
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        
        element.style.transition = 'all 0.3s ease';
        element.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.3)';
        
        setTimeout(() => {
          element.style.boxShadow = '';
        }, 1500);
      }
    };

    // Функция для открытия диалога редактирования
    const editContact = (contact) => {
      // Сохраняем оригинальные данные
      Object.keys(originalContactData).forEach(key => {
        originalContactData[key] = contact[key] || null;
      });
      
      // Заполняем данные для редактирования
      editContactData.ID = contact.ID;
      editContactData.FULL_NAME = contact.FULL_NAME;
      editContactData.POST = contact.POST || '';
      editContactData.UF_CRM_1753083765 = contact.UF_CRM_1753083765 ? String(contact.UF_CRM_1753083765) : null;
      editContactData.UF_CRM_1753364801 = contact.UF_CRM_1753364801 ? 
        contact.UF_CRM_1753364801.map(id => String(id)) : [];
      
      editContactData.emailValue = contact.EMAIL && contact.EMAIL[0] ? 
        contact.EMAIL[0].VALUE : '';
      
      editContactData.phoneValue = contact.PHONE && contact.PHONE[0] ? 
        contact.PHONE[0].VALUE : '';
      
      editDialog.value = true;
    };

    // Функция для сохранения изменений контакта
    const saveEdit = async () => {
      try {
        saveLoading.value = true;
        
        const updateData = {
          ID: editContactData.ID,
          POST: editContactData.POST || ''
        };
        
        if (editContactData.UF_CRM_1753083765) {
          updateData.UF_CRM_1753083765 = editContactData.UF_CRM_1753083765;
        } else {
          updateData.UF_CRM_1753083765 = '';
        }
        
        if (editContactData.UF_CRM_1753364801 && editContactData.UF_CRM_1753364801.length > 0) {
          updateData.UF_CRM_1753364801 = editContactData.UF_CRM_1753364801;
        } else {
          updateData.UF_CRM_1753364801 = [];
        }
        
        if (editContactData.emailValue !== originalContactData.emailValue) {
          updateData.EMAIL = editContactData.emailValue ? 
            [{ VALUE: editContactData.emailValue, VALUE_TYPE: 'WORK' }] : 
            [];
        }
        
        if (editContactData.phoneValue !== originalContactData.phoneValue) {
          updateData.PHONE = editContactData.phoneValue ? 
            [{ VALUE: editContactData.phoneValue, VALUE_TYPE: 'WORK' }] : 
            [];
        }
        
        console.log('Обновление контакта:', updateData);
        
        await new Promise((resolve, reject) => {
          BX24.callMethod('crm.contact.update', {
            'id': updateData.ID,
            'fields': updateData,
          }, (response) => {
            if (response.error()) {
              reject(response.error());
            } else {
              resolve(response.data());
            }
          });
        });
        
        const contactIndex = contacts.value.findIndex(c => c.ID === editContactData.ID);
        if (contactIndex !== -1) {
          const updatedContact = { ...contacts.value[contactIndex] };
          
          updatedContact.POST = updateData.POST;
          updatedContact.UF_CRM_1753083765 = updateData.UF_CRM_1753083765;
          updatedContact.UF_CRM_1753364801 = updateData.UF_CRM_1753364801;
          
          if (updateData.EMAIL) {
            updatedContact.EMAIL = updateData.EMAIL;
          }
          
          if (updateData.PHONE) {
            updatedContact.PHONE = updateData.PHONE;
          }
          
          contacts.value[contactIndex] = updatedContact;
          contacts.value = [...contacts.value];
        }
        
        editDialog.value = false;
        alert('Контакт успешно обновлен');
        
      } catch (error) {
        console.error('Ошибка при обновлении контакта:', error);
        alert('Произошла ошибка при обновлении контакта');
      } finally {
        saveLoading.value = false;
      }
    };

    // Функция для отмены редактирования
    const cancelEdit = () => {
      editDialog.value = false;
      
      setTimeout(() => {
        Object.keys(editContactData).forEach(key => {
          editContactData[key] = '';
        });
        Object.keys(originalContactData).forEach(key => {
          originalContactData[key] = '';
        });
      }, 300);
    };

    // Функция для открытия диалога создания контакта
    const openCreateDialog = () => {
      Object.keys(newContactData).forEach(key => {
        newContactData[key] = key.includes('UF_CRM') ? (key.includes('1753364801') ? [] : null) : '';
      });
      
      duplicateMessages.value = [];
      createDialog.value = true;
    };

    // Функция для проверки дубликатов
    const checkDuplicates = () => {
      duplicateMessages.value = [];
      
      const fullName = newContactData.FULL_NAME?.trim().toLowerCase();
      const email = newContactData.emailValue?.trim().toLowerCase();
      const phone = newContactData.phoneValue?.trim();
      
      if (fullName) {
        const nameDuplicates = contacts.value.filter(contact => {
          const contactFullName = contact.FULL_NAME?.toLowerCase();
          return contactFullName && 
                 (contactFullName === fullName || 
                  contactFullName.includes(fullName) || 
                  fullName.includes(contactFullName));
        });
        
        nameDuplicates.forEach(duplicate => {
          duplicateMessages.value.push({
            type: 'fio',
            message: `Контакт с похожим ФИО уже существует: `,
            contactId: duplicate.ID,
            contactName: duplicate.FULL_NAME
          });
        });
      }
      
      if (email) {
        const emailDuplicate = contacts.value.find(contact => 
          contact.EMAIL && 
          contact.EMAIL[0] && 
          contact.EMAIL[0].VALUE?.trim().toLowerCase() === email
        );
        
        if (emailDuplicate) {
          duplicateMessages.value.push({
            type: 'email',
            message: `Email уже используется контактом: `,
            contactId: emailDuplicate.ID,
            contactName: emailDuplicate.FULL_NAME
          });
        }
      }
      
      if (phone) {
        const phoneDuplicate = contacts.value.find(contact => 
          contact.PHONE && 
          contact.PHONE[0] && 
          contact.PHONE[0].VALUE?.trim() === phone
        );
        
        if (phoneDuplicate) {
          duplicateMessages.value.push({
            type: 'phone',
            message: `Телефон уже используется контактом: `,
            contactId: phoneDuplicate.ID,
            contactName: phoneDuplicate.FULL_NAME
          });
        }
      }
      
      return duplicateMessages.value.length === 0;
    };

    // Функция для создания контакта
// Функция для создания контакта
const createContact = async () => {
  try {
    if (!newContactData.FULL_NAME?.trim()) {
      alert('Поле "ФИО" обязательно для заполнения');
      return;
    }
    
    if (!checkDuplicates()) {
      const confirmCreate = confirm('Найдены возможные дубликаты. Хотите продолжить создание?\n\n' + 
        duplicateMessages.value.map(m => m.message + m.contactName).join('\n'));
      if (!confirmCreate) {
        return;
      }
    }
    
    createLoading.value = true;
    
    const createData = {
      NAME: newContactData.FULL_NAME?.split(' ')[1] || '',
      LAST_NAME: newContactData.FULL_NAME?.split(' ')[0] || '',
      SECOND_NAME: newContactData.FULL_NAME?.split(' ')[2] || '',
      POST: newContactData.POST || '',
      TYPE_ID: 'CLIENT'
    };
    
    if (newContactData.UF_CRM_1753083765) {
      createData.UF_CRM_1753083765 = newContactData.UF_CRM_1753083765;
    }
    
    if (newContactData.UF_CRM_1753364801 && newContactData.UF_CRM_1753364801.length > 0) {
      createData.UF_CRM_1753364801 = newContactData.UF_CRM_1753364801;
    }
    
    if (newContactData.emailValue) {
      createData.EMAIL = [{
        VALUE: newContactData.emailValue,
        VALUE_TYPE: 'WORK'
      }];
    }
    
    if (newContactData.phoneValue) {
      createData.PHONE = [{
        VALUE: newContactData.phoneValue,
        VALUE_TYPE: 'WORK'
      }];
    }
    
    console.log('Создание контакта:', createData);
    
    const createdContact = await new Promise((resolve, reject) => {
      BX24.callMethod('crm.contact.add', {
        'fields': createData,
      }, (response) => {
        if (response.error()) {
          reject(response.error());
        } else {
          resolve(response.data());
        }
      });
    });

    await new Promise((resolve, reject) => {
      BX24.callMethod('crm.company.contact.add', {
        'ID': companyId.value,
        'FIELDS': { 'CONTACT_ID': createdContact }
      }, (response) => {
        if (response.error()) {
          reject(response.error());
        } else {
          resolve(response.data());
        }
      });
    });
    
    // Если мы в сделке, обновляем поле сделки UF_CRM_1754290331
    if (enityId.value === 'CRM_DEAL_DETAIL_TAB') {
      try {
        // Получаем текущий список контактов из сделки
        const dealData = await new Promise((resolve, reject) => {
          BX24.callMethod('crm.deal.get', {
            'id': dealId.value,
          }, (response) => {
            if (response.error()) {
              reject(response.error());
            } else {
              resolve(response.data());
            }
          });
        });
        console.log(dealData.UF_CRM_1754290331);
        dealData.UF_CRM_1754290331.push(createdContact)
        console.log(dealData.UF_CRM_1754290331);
        // Обновляем поле сделки
        await new Promise((resolve, reject) => {
          BX24.callMethod('crm.deal.update', {
            'id': dealId.value,
            'fields': { 'UF_CRM_1754290331': dealData.UF_CRM_1754290331 }
          }, (response) => {
            if (response.error()) {
              reject(response.error());
            } else {
              resolve(response.data());
            }
          });
        });

      } catch (dealError) {
        console.error('Ошибка при обновлении поля сделки:', dealError);
        // Не прерываем создание контакта, просто логируем ошибку
      }
    }
    
    const loadedContact = await callApi(
      "crm.contact.list", 
      { ID: createdContact }, 
      ["UF_CRM_1750766630", "NAME", "LAST_NAME", "SECOND_NAME", "POST", "TYPE_ID", "EMAIL", "PHONE", "UF_CRM_1753364801", "UF_CRM_1753083765", "UF_CRM_1756633452"]
    );
    
    if (loadedContact[0]) {
      loadedContact[0].FULL_NAME = `${loadedContact[0].LAST_NAME ? loadedContact[0].LAST_NAME : ""} ${loadedContact[0].NAME ? loadedContact[0].NAME : ""} ${loadedContact[0].SECOND_NAME ? loadedContact[0].SECOND_NAME : ""}`;
      
      if (loadedContact[0].UF_CRM_1750766630 && loadedContact[0].UF_CRM_1750766630.length > 0) {
        const productIds = loadedContact[0].UF_CRM_1750766630.map(id => Number(id));

        const medications = productIds
          .map(id => products.value.find(product => product.id == Number(id)))
          .map(product => product && product.title)
          .filter(name => name !== undefined);

        const directions = productIds
          .map(id => products.value.find(product => product.id === Number(id)))
          .map(product => {
            if (!product) return [];
            let values = Array.isArray(product.ufCrm26_1753365041) ?
              product.ufCrm26_1753365041 :
              [product.ufCrm26_1753365041];
            return values.map(value => audienceTitles.value.get(String(value)) || String(value)).filter(d => d !== undefined);
          });

        loadedContact[0].medications = medications;
        loadedContact[0].directions = directions;
      }
      
      // Добавляем новый контакт в список
      contacts.value.push(loadedContact[0]);
      
      // Обновляем contactsIds.value
      contactsIds.value.push(loadedContact[0].ID);
      
      // Принудительно обновляем реактивные данные
      contacts.value = [...contacts.value];
      contactsIds.value = [...contactsIds.value];
    }
    
    createDialog.value = false;
    alert('Контакт успешно создан и привязан к компании' + (enityId.value === 'CRM_DEAL_DETAIL_TAB' ? ' и добавлен в сделку' : ''));
    
    // Сбрасываем данные формы
    Object.keys(newContactData).forEach(key => {
      newContactData[key] = key.includes('UF_CRM') ? (key.includes('1753364801') ? [] : null) : '';
    });
    
    duplicateMessages.value = [];
    
  } catch (error) {
    console.error('Ошибка при создании контакта:', error);
    alert('Произошла ошибка при создании контакта');
  } finally {
    createLoading.value = false;
  }
};
    // Функция для отмены создания
    const cancelCreate = () => {
      createDialog.value = false;
      
      setTimeout(() => {
        Object.keys(newContactData).forEach(key => {
          newContactData[key] = key.includes('UF_CRM') ? (key.includes('1753364801') ? [] : null) : '';
        });
        duplicateMessages.value = [];
      }, 300);
    };

    // Функция для получения названий целевых аудиторий контакта
    const getContactAudienceTitles = (contact) => {
      if (!contact.UF_CRM_1753364801 || contact.UF_CRM_1753364801.length === 0) {
        return [];
      }
      
      return contact.UF_CRM_1753364801
        .map(audienceId => audienceTitles.value.get(String(audienceId)) || String(audienceId))
        .filter(title => title && title.trim() !== '');
    };

    // Функция для открепления контакта от компании
    const detachContact = async (contactId) => {
      try {
        if (confirm('Вы действительно хотите открепить этот контакт от компании?')) {
          detachLoading.value = true;
          detachLoadingText.value = 'Открепление контакта...';
          
          const result = await detachContacts(companyId.value, [contactId]);
          
          if (result.success) {
            contacts.value = contacts.value.filter(contact => contact.ID !== contactId);
            
            setTimeout(() => {
              alert('Контакт успешно откреплен');
            }, 100);
          } else {
            setTimeout(() => {
              alert(`Ошибка при откреплении контакта: ${result.errors.join(', ')}`);
            }, 100);
          }
        }
      } catch (error) {
        console.error('Ошибка при откреплении контакта:', error);
        setTimeout(() => {
          alert('Произошла ошибка при откреплении контакта');
        }, 100);
      } finally {
        setTimeout(() => {
          detachLoading.value = false;
        }, 300);
      }
    };

    // Функция для проверки ключевого лица
    const isKeyPerson = (contactId) => {
      return keyPersons.value.includes(contactId);
    };

    // Функция для переключения ключевого лица
    const toggleKeyPerson = async (contactId) => {
      try {
        if (detachLoading.value) return;
        
        keyPersons.value = contactId;
        BX24.callMethod("crm.deal.update", {id: dealId.value, fields: { UF_CRM_1756807710: contactId}}, () => {});
      } catch (error) {
        console.error('Ошибка при обновлении ключевых лиц:', error);
      }
    };

    // Существующие функции без изменений
    const parseCompanyTargetAudience = (fieldValue) => {
      const result = new Map();
      if (!fieldValue) return result;
      
      const lines = fieldValue.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        const match = line.match(/^(\d+)\s*-\s*(.+)$/);
        if (match) {
          const companyId = match[1].trim();
          const audienceIds = match[2].split(',')
            .map(id => id.trim())
            .filter(id => id && id !== '');
          
          result.set(companyId, audienceIds);
        }
      });
      return result;
    };

    const fetchKeyPersons = async () => {
      try {
        if (enityId.value === 'CRM_DEAL_DETAIL_TAB') {
          const deal = await callApi("crm.deal.list", { 
            ID: dealId.value 
          }, ["UF_CRM_1756807710"]);
          
          if (deal[0] && deal[0].UF_CRM_1756807710) {
            keyPersons.value = deal[0].UF_CRM_1756807710;
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке ключевых лиц:', error);
      }
    };

    const fetchCompanyData = async () => {
      domain.value = BX24.getDomain();
      enityId.value = BX24.placement.info().placement;
      
      enityId.value = enityId.value === 'DEFAULT' ? 'CRM_DEAL_DETAIL_TAB' : enityId.value;
      console.log(enityId.value);
      let contactsList = "";

      try {
        if (enityId.value === "CRM_DEAL_DETAIL_TAB") {
          const id = BX24.placement.info().options.ID ?? 67616;
          // Добавляем поле UF_CRM_1742797326 для получения ID мероприятия
          const deal = await callApi("crm.deal.list", { ID: id }, ["COMPANY_ID", "UF_CRM_1754290331", "UF_CRM_1753365812", "UF_CRM_1742797326"]);
          dealId.value = deal[0].ID;
          companyId.value = deal[0].COMPANY_ID;
          contactsList = deal[0].UF_CRM_1754290331;
          console.log(contactsList);
          dealAudience.value = deal[0].UF_CRM_1753365812 || [];
          // Получаем ID мероприятия из поля сделки
          mailingEventId.value = deal[0].UF_CRM_1742797326 || null;
        } else if(enityId.value === "CRM_COMPANY_DETAIL_TAB") {
          companyId.value = BX24.placement.info().options.ID;
          contactsList = await new Promise((resolve, reject) => {
            BX24.callMethod("crm.company.contact.items.get", { id: companyId.value },
              (response) => {
                if (response.error()) {
                  reject(response.error());
                } else {
                  resolve(response.data().map((item) => item.CONTACT_ID));
                }
              }
            );
          });
        }

        const company = await new Promise((resolve, reject) => {
          BX24.callMethod("crm.company.get", { id: companyId.value },
            (response) => {
              if (response.error()) {
                reject(response.error());
              } else {
                resolve(response.data());
              }
            }
          );
        });

        companyTargetAudience.value = parseCompanyTargetAudience(company.UF_CRM_1756633452);

        return [contactsList, company.UF_CRM_1745407296, company.UF_CRM_1753257731];
      } catch (err) {
        console.error('Ошибка:', err);
        error.value = err.message;
        throw err;
      }
    };

    const fetchData = async () => {
      try {
        loading.value = true;
        const [users, productsToFetch, equipmentToFetch] = await fetchCompanyData();
        await fetchKeyPersons();
        
        // Загружаем данные об исключенных контактах
        if (mailingEventId.value) {
          await fetchExcludedContacts();
        }

        const userData = await callApi("crm.contact.list", { ID: users }, ["UF_CRM_1750766630", "NAME", "LAST_NAME", "SECOND_NAME", "POST", "TYPE_ID", "EMAIL", "PHONE", "UF_CRM_1753364801", "UF_CRM_1753083765", "UF_CRM_1756633452"]);
        
        products.value = await callApi("crm.item.list", {id: productsToFetch}, ["id", "title", "ufCrm26_1753365041"], 189);
        equipment.value = await callApi("crm.item.list", {id: equipmentToFetch}, ["id", "title", "ufCrm62_1753365319"], 1104);
        
        const productsFields = await getListElements(216, {}, ["ID", "NAME"]);
        
        const cities = await callApi("crm.item.list", {}, ["id", "title"], 1094, 0, 0);
        
        audienceTitles.value = new Map(productsFields.map(item => [item.ID, item.NAME]));
        cityTitles.value = new Map(cities.map(item => [String(item.id), item.title]));

        userData.forEach(contact => {
          contact.FULL_NAME = `${contact.LAST_NAME ? contact.LAST_NAME : ""} ${contact.NAME ? contact.NAME : ""} ${contact.SECOND_NAME ? contact.SECOND_NAME : ""}`;
          if (contact.UF_CRM_1750766630 && contact.UF_CRM_1750766630.length > 0) {
            const productIds = contact.UF_CRM_1750766630.map(id => Number(id));

            const medications = productIds
              .map(id => products.value.find(product => product.id == Number(id)))
              .map(product => product && product.title)
              .filter(name => name !== undefined);

            const directions = productIds
              .map(id => products.value.find(product => product.id === Number(id)))
              .map(product => {
                if (!product) return [];
                let values = Array.isArray(product.ufCrm26_1753365041) ?
                  product.ufCrm26_1753365041 :
                  [product.ufCrm26_1753365041];
                return values.map(value => audienceTitles.value.get(String(value)) || String(value)).filter(d => d !== undefined);
              });

            contact.medications = medications;
            contact.directions = directions;
          }
        });

        contacts.value = userData;
        contactsIds.value = userData.map((item) => item.ID);
      } catch (err) {
        error.value = err.message || 'Ошибка загрузки данных';
        console.error('Ошибка:', err);
      } finally {
        loading.value = false;
      }
    };

    const isContactInTargetAudience = (contact) => {
      if (!contact.UF_CRM_1753364801 || contact.UF_CRM_1753364801.length === 0) {
        return false;
      }

      const targetAudiences = enityId.value === 'CRM_DEAL_DETAIL_TAB' ? 
        dealAudience.value.map(id => String(id)) : 
        (companyTargetAudience.value.get(String(companyId.value)) || []);
      
      if (targetAudiences.length === 0) {
        return true;
      }
      
      return contact.UF_CRM_1753364801.some(audienceId => 
        targetAudiences.includes(String(audienceId))
      );
    };

    const filteredGroupedByAudience = computed(() => {
      const groups = new Map();
      contacts.value
        .filter(contact => isContactInTargetAudience(contact))
        .forEach(contact => {
          contact.UF_CRM_1753364801.forEach(audienceId => {
            const audienceTitle = audienceTitles.value.get(String(audienceId)) || String(audienceId);
            
            const targetAudiencesForThis = enityId.value === 'CRM_DEAL_DETAIL_TAB' ? 
              dealAudience.value.map(id => String(id)) :
              (contact.UF_CRM_1756633452 ? 
                parseCompanyTargetAudience(contact.UF_CRM_1756633452).get(String(companyId.value)) || [] :
                companyTargetAudience.value.get(String(companyId.value)) || []);
            
            if (targetAudiencesForThis.length === 0 || targetAudiencesForThis.includes(String(audienceId))) {
              if (!groups.has(audienceTitle)) {
                groups.set(audienceTitle, []);
              }
              if (!groups.get(audienceTitle).some(c => c.ID === contact.ID)) {
                groups.get(audienceTitle).push(contact);
              }
            }
          });
        });
      return Object.fromEntries(groups);
    });

    const filteredAudienceMedications = computed(() => {
      const medsByAudience = {};
      const targetAudiences = enityId.value === 'CRM_DEAL_DETAIL_TAB' ? 
        dealAudience.value.map(id => String(id)) : 
        (companyTargetAudience.value.get(String(companyId.value)) || []);
      
      const showAll = targetAudiences.length === 0;
      
      products.value.forEach(product => {
        let audiences = Array.isArray(product.ufCrm26_1753365041) ? 
          product.ufCrm26_1753365041 : 
          [product.ufCrm26_1753365041];
        audiences.forEach(audienceId => {
          const audienceTitle = audienceTitles.value.get(String(audienceId)) || String(audienceId);
          
          if (showAll || targetAudiences.includes(String(audienceId))) {
            if (!medsByAudience[audienceTitle]) {
              medsByAudience[audienceTitle] = [];
            }
            if (!medsByAudience[audienceTitle].some(med => med.id === product.id)) {
              medsByAudience[audienceTitle].push({ id: product.id, title: product.title });
            }
          }
        });
      });
      return medsByAudience;
    });

    const filteredAudienceEquipment = computed(() => {
      const equipByAudience = {};
      const targetAudiences = enityId.value === 'CRM_DEAL_DETAIL_TAB' ? 
        dealAudience.value.map(id => String(id)) : 
        (companyTargetAudience.value.get(String(companyId.value)) || []);
      
      const showAll = targetAudiences.length === 0;
      
      equipment.value.forEach(equip => {
        let audiences = Array.isArray(equip.ufCrm62_1753365319) ? 
          equip.ufCrm62_1753365319 : 
          [equip.ufCrm62_1753365319];
        audiences.forEach(audienceId => {
          const audienceTitle = audienceTitles.value.get(String(audienceId)) || String(audienceId);
          
          if (showAll || targetAudiences.includes(String(audienceId))) {
            if (!equipByAudience[audienceTitle]) {
              equipByAudience[audienceTitle] = [];
            }
            if (!equipByAudience[audienceTitle].some(e => e.id === equip.id)) {
              equipByAudience[audienceTitle].push({ id: equip.id, title: equip.title });
            }
          }
        });
      });
      return equipByAudience;
    });

    const contactsWithoutAudience = computed(() => {
      const targetAudiences = enityId.value === 'CRM_DEAL_DETAIL_TAB' ? 
        dealAudience.value.map(id => String(id)) : 
        (companyTargetAudience.value.get(String(companyId.value)) || []);
      
      if (targetAudiences.length === 0) {
        return [];
      }
      
      return contacts.value.filter(contact => 
        !contact.UF_CRM_1753364801 || 
        contact.UF_CRM_1753364801.length === 0
      );
    });

    const audiencesWithoutContacts = computed(() => {
      const result = {};
      const targetAudiences = enityId.value === 'CRM_DEAL_DETAIL_TAB' ? 
        dealAudience.value.map(id => String(id)) : 
        (companyTargetAudience.value.get(String(companyId.value)) || []);
      
      if (targetAudiences.length === 0) {
        return result;
      }
      
      targetAudiences.forEach(audienceId => {
        const audienceTitle = audienceTitles.value.get(String(audienceId)) || String(audienceId);
        
        if (!filteredGroupedByAudience.value[audienceTitle] || 
            filteredGroupedByAudience.value[audienceTitle].length === 0) {
          
          const hasMedications = filteredAudienceMedications.value[audienceTitle] && 
                                filteredAudienceMedications.value[audienceTitle].length > 0;
          const hasEquipment = filteredAudienceEquipment.value[audienceTitle] && 
                              filteredAudienceEquipment.value[audienceTitle].length > 0;
          
          if (hasMedications || hasEquipment) {
            result[audienceTitle] = {
              medications: filteredAudienceMedications.value[audienceTitle] || [],
              equipment: filteredAudienceEquipment.value[audienceTitle] || []
            };
          }
        }
      });
      
      return result;
    });

    onMounted(() => {
      BX24.ready(function () {
          BX24.init(function () {
              fetchData();
          });
      });
    });

    return {
      loading,
      detachLoading,
      detachLoadingText,
      editDialog,
      saveLoading,
      citiesLoading,
      createDialog,
      createLoading,
      error,
      contacts,
      domain,
      filteredGroupedByAudience,
      contactsWithoutAudience,
      audienceTitles,
      cityTitles,
      filteredAudienceMedications,
      filteredAudienceEquipment,
      deleteCard: detachContact,
      enityId,
      audiencesWithoutContacts,
      isKeyPerson,
      toggleKeyPerson,
      keyPersons,
      getContactAudienceTitles,
      detachContact,
      editContact,
      saveEdit,
      cancelEdit,
      editContactData,
      audienceOptions,
      cityOptions,
      openCreateDialog,
      createContact,
      cancelCreate,
      newContactData,
      duplicateMessages,
      checkDuplicates,
      selectedAudienceFilter,
      audienceFilterOptions,
      scrollToAudience,
      isExcludedFromMailing, // Добавляем функцию проверки исключения
    };
  }
}
</script>

<style>
#app {
    font-size: .8rem;
    padding-bottom: .2rem
}

.v-input__details {
  display: none;
}

.text-h6 {
    font-weight: 700;
    margin-bottom: 4px
}

a {
    color: #000
}

.name {
    font-size: .7em!important;
    font-weight: 400
}

.v-list-item-subtitle {
    overflow: visible;
    display: block;
    font-size: 1em!important
}

.medication {
    white-space: nowrap
}

span {
    font-size: .9em
}

.v-list {
    padding: 0
}

.v-list-item--density-default:not(.v-list-item--nav).v-list-item--one-line {
    padding-inline:.5rem
}

.v-list .v-list-item--density-default:not(.v-list-item--nav).v-list-item--one-line {
    padding-inline:0;
    padding: 0 .5rem
}

.v-card-title {
    padding: .5rem;
    padding-bottom: 0;
    color: gray;
    font-size: 1.35em;
    font-weight: 600
}

.loading {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    background-color: #fff;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    flex-direction: column;
    gap: 2rem
}

.item {
    margin: .4rem;
    color: 000000
}

.v-list-item-subtitle span {
    font-size: 1em
}

.delete{
  transform: scale(0.5);
  position: relative;
  left: -0.5rem;
}

.key-person-btn {
  width: 24px !important;
  height: 24px !important;
  border-radius: 100% !important;
}

.key-person-btn .v-icon {
  font-size: 16px !important;
}

.delete-btn {
  width: 1.5rem !important;
  height: 1.5rem !important;
  border-radius: 50% !important;
  background-color: rgba(255, 82, 82, 0.1) !important;
}

.delete-btn:hover {
  background-color: rgba(255, 82, 82, 0.2) !important;
}

.delete-btn .v-icon {
  font-size: 1rem !important;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.key-person-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Стили для редактирования */
.contact-item {
  cursor: pointer !important;
  transition: background-color 0.2s ease;
}

.contact-item:hover {
  background-color: rgba(25, 118, 210, 0.04);
}

/* Стили для диалога */
.v-dialog .v-card-title {
  padding: 16px 24px !important;
  color: white !important;
  font-size: 1.25rem !important;
  font-weight: 500 !important;
}

.v-dialog .v-text-field,
.v-dialog .v-select {
  margin-bottom: 8px !important;
}

.v-dialog .v-btn {
  text-transform: none !important;
  letter-spacing: normal !important;
}

.white{
  color: white;
}

/* Стили для метки исключения из рассылки */
.excluded-label {
  color: #ff6b6b;
  font-size: 0.8em;
  font-style: italic;
  background-color: rgba(255, 107, 107, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 107, 107, 0.3);
}
</style>