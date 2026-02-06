<template>
  <v-container>
    <v-card>
      <v-card-title>
        <button @click="showDeals()">Установить приложение</button>
        <h3>Data Table</h3>
      </v-card-title>
    </v-card>
  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  setup() {
    },
      methods: {
        showDeals() {
          BX24.init(() => {
            BX24.callMethod('placement.bind', {
              PLACEMENT: 'CRM_DEAL_DETAIL_TAB',
              HANDLER: "https://cdn-ru.bitrix24.ru/b5113579/app_local/7209cd79cce8cfe3da9b5d909bbeb7d1/index.html",
              TITLE: 'Контакты для рассылки'
            },
            (res) => {
                if (res.data()) {
                    this.deals = res.data();
                    alert(deals)
                }
                console.log(res);
              })
        });
      }
  },
};
</script>

<style scoped>
/* Добавьте свои стили, если необходимо */
</style>