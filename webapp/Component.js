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
            // Get user info from IAS (SAP BTP User API)
            var that = this;
            
            // Try to get user info from the SAP BTP user API
            fetch("/services/userapi/currentUser", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(function(response) {
                if (response.ok) {
                    return response.json();
                }
                throw new Error("No se pudo obtener información del usuario");
            })
            .then(function(userData) {
                // Store user ID in the app model
                var oAppModel = that.getModel("app");
                oAppModel.setProperty("/userId", userData.name || userData.email || "10000");
                oAppModel.setProperty("/userInfo", userData);
            })
            .catch(function(error) {
                console.error("Error getting user info:", error);
                // Fallback to a default user ID for development
                var oAppModel = that.getModel("app");
                oAppModel.setProperty("/userId", "10000");
                oAppModel.setProperty("/userInfo", { name: "Usuario Demo" });
            });
        }
    });
});
