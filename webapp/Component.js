sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    "com/ccb/quota/service/QuotaService"
], function (UIComponent, Device, JSONModel, QuotaService) {
    "use strict";

    return UIComponent.extend("com.ccb.quota.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(new JSONModel(Device), "device");

            // Initialize the quota service
            this._oQuotaService = new QuotaService();
            this.setModel(new JSONModel(), "app");

            // Get user information from IAS
            this._getUserInfo();
        },

        getQuotaService: function() {
            return this._oQuotaService;
        },

        _getUserInfo: function() {
            var that = this;
            var oAppModel = this.getModel("app");
            
            console.log("🔐 Obteniendo información del usuario autenticado...");
            
            // Use QuotaService to get user info
            this._oQuotaService.getUserInfo()
                .then(function(oUserInfo) {
                    console.log("✅ Usuario autenticado:", oUserInfo);
                    
                    // Store user information in app model
                    oAppModel.setProperty("/userId", oUserInfo.id);
                    oAppModel.setProperty("/userInfo", oUserInfo);
                    oAppModel.setProperty("/userName", oUserInfo.fullName);
                    
                    console.log("✅ User ID configurado:", oUserInfo.id);
                })
                .catch(function(error) {
                    console.error("❌ Error obteniendo información del usuario:", error);
                    
                    // Fallback for development/testing
                    console.warn("⚠️ Usando usuario de prueba por defecto");
                    oAppModel.setProperty("/userId", "10000");
                    oAppModel.setProperty("/userInfo", { 
                        id: "10000",
                        name: "Usuario Demo",
                        email: "demo@ccb.org.co",
                        fullName: "Usuario Demo"
                    });
                    oAppModel.setProperty("/userName", "Usuario Demo");
                });
        }
    });
});
