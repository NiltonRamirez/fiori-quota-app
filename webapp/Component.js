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

            // Wait for FLP to be ready before getting user info
            this._waitForFLPThenGetUserInfo();
        },

        _waitForFLPThenGetUserInfo: function() {
            var that = this;
            
            // Check if we're in FLP/Work Zone
            if (sap && sap.ushell && sap.ushell.Container) {
                // FLP is ready, get user info immediately
                console.log("✅ FLP ya está disponible, obteniendo usuario...");
                this._getUserInfo();
            } else {
                // FLP not ready yet, wait for it
                console.log("⏳ Esperando a que FLP esté disponible...");
                
                // Set a timeout to wait for FLP to be ready
                var checkFLPInterval = setInterval(function() {
                    if (sap && sap.ushell && sap.ushell.Container) {
                        console.log("✅ FLP ahora está disponible!");
                        clearInterval(checkFLPInterval);
                        that._getUserInfo();
                    }
                }, 100); // Check every 100ms
                
                // Fallback: if FLP not ready after 5 seconds, proceed anyway
                setTimeout(function() {
                    clearInterval(checkFLPInterval);
                    console.log("⚠️ FLP no se cargó en 5 segundos, procediendo sin él...");
                    if (!that.getModel("app").getProperty("/userId")) {
                        that._getUserInfo();
                    }
                }, 5000);
            }
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

                    // Controlled fallback for development/testing only
                    var sTestUserId = that._getTestUserId();
                    if (sTestUserId) {
                        console.warn("⚠️ Usando usuario de prueba configurado:", sTestUserId);
                        oAppModel.setProperty("/userId", sTestUserId);
                        oAppModel.setProperty("/userInfo", {
                            id: sTestUserId,
                            name: "Usuario Demo",
                            email: "demo@ccb.org.co",
                            fullName: "Usuario Demo"
                        });
                        oAppModel.setProperty("/userName", "Usuario Demo");
                    } else {
                        console.error("❌ No se pudo resolver un usuario autenticado ni de prueba");
                        oAppModel.setProperty("/userId", "");
                        oAppModel.setProperty("/userInfo", null);
                        oAppModel.setProperty("/userName", "");
                    }
                });
        },

        _getTestUserId: function() {
            var oParams = new URLSearchParams(window.location.search || "");
            var sQueryUserId = oParams.get("testUserId");
            var sStorageUserId = window.localStorage.getItem("quota.testUserId");
            var sConfiguredUserId = sQueryUserId || sStorageUserId;

            if (sConfiguredUserId) {
                return sConfiguredUserId;
            }

            var bLocalHost = ["localhost", "127.0.0.1"].indexOf(window.location.hostname) !== -1;
            if (bLocalHost) {
                return "10000";
            }

            return "";
        }
    });
});
