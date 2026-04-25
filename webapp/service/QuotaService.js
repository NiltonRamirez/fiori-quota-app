sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    return BaseObject.extend("com.ccb.quota.service.QuotaService", {
        
        constructor: function () {
            // Base URL: sap.ui.require.toUrl() incluye el prefijo del HTML5 repo automáticamente en Work Zone
            this._sBaseUrl = sap.ui.require.toUrl("com/ccb/quota");
            // CSRF Token for POST requests
            this._sCsrfToken = null;
            // Cached user info
            this._oUserInfo = null;
        },

        /**
         * Get current user information from XSUAA
         * @returns {Promise} Promise with user info object
         */
        getUserInfo: function() {
            if (this._oUserInfo) {
                console.log("👤 Using cached user info:", this._oUserInfo);
                return Promise.resolve(this._oUserInfo);
            }

            console.log("🔍 Obteniendo información del usuario autenticado...");

            return this._getUserFromFLP()
                .then(function(oUserFromFLP) {
                    if (oUserFromFLP && oUserFromFLP.email) {
                        console.log("✅ Email obtenido de FLP:", oUserFromFLP.email);
                        return this._resolveEmployeeIdByEmail(oUserFromFLP);
                    }

                    // Fallback: intentar obtener email del token JWT
                    console.log("🔐 FLP sin email, intentando token XSUAA...");
                    var oUserFromToken = this._getUserFromToken();
                    if (oUserFromToken && oUserFromToken.email) {
                        console.log("✅ Email obtenido del token:", oUserFromToken.email);
                        return this._resolveEmployeeIdByEmail(oUserFromToken);
                    }

                    throw new Error("No se encontró email de usuario en FLP ni en token");
                }.bind(this));
        },

        /**
         * Resuelve el employeeId llamando al servicio by-email y lo asigna como id del usuario
         * @private
         */
        _resolveEmployeeIdByEmail: function(oBaseUserInfo) {
            var sEmail = oBaseUserInfo.email;
            var sUrl = this._sBaseUrl + "/http/api/v1/users/by-email?email=" + encodeURIComponent(sEmail);

            console.log("📡 Resolviendo employeeId para:", sEmail, "→", sUrl);

            return fetch(sUrl, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error("Error al consultar usuario por email: " + response.status);
                }
                return response.json();
            })
            .then(function(oData) {
                console.log("✅ Respuesta by-email:", oData);
                if (oData.status === "success" && oData.data && oData.data.employeeId) {
                    oBaseUserInfo.id = oData.data.employeeId;
                    this._oUserInfo = oBaseUserInfo;
                    console.log("✅ employeeId resuelto:", oData.data.employeeId);
                    return this._oUserInfo;
                }
                throw new Error("employeeId no encontrado en respuesta: " + JSON.stringify(oData));
            }.bind(this))
            .catch(function(error) {
                console.error("❌ Error resolviendo employeeId por email:", error);
                throw error;
            });
        },

        /**
         * Get user from Fiori Launchpad
         * @private
         * @returns {Promise} Promise that resolves with user info or null
         */
        _getUserFromFLP: function() {
            console.log("🔍 Verificando disponibilidad de sap.ushell...");
            console.log("  - typeof sap:", typeof sap);
            console.log("  - sap existe:", !!sap);
            
            if (sap) {
                console.log("  - typeof sap.ushell:", typeof sap.ushell);
                console.log("  - sap.ushell existe:", !!sap.ushell);
            }
            
            if (sap && sap.ushell) {
                console.log("  - typeof sap.ushell.Container:", typeof sap.ushell.Container);
                console.log("  - sap.ushell.Container existe:", !!sap.ushell.Container);
            }
            
            // Check if we're running in Fiori Launchpad/Work Zone
            if (sap && sap.ushell && sap.ushell.Container) {
                console.log("🚀 FLP Container detectado, obteniendo UserInfo service (async)...");
                
                // Use getServiceAsync for Work Zone (async method - this is the correct approach)
                return sap.ushell.Container.getServiceAsync("UserInfo")
                    .then(function(oUserInfoService) {
                        console.log("📦 UserInfo service obtenido:", oUserInfoService);
                        console.log("📦 Tipo de service:", typeof oUserInfoService);
                        
                        if (oUserInfoService) {
                            var sUserId = null;
                            var sEmail = null;
                            var sFullName = null;
                            var sFirstName = null;
                            var sLastName = null;
                            
                            console.log("🔍 Intentando métodos del UserInfo service:");
                            
                            // getId()
                            try {
                                sUserId = oUserInfoService.getId();
                                console.log("  ✅ getId():", sUserId, "(tipo:", typeof sUserId, ")");
                            } catch (e) {
                                console.log("  ❌ getId() falló:", e.message);
                            }
                            
                            // getEmail()
                            try {
                                sEmail = oUserInfoService.getEmail();
                                console.log("  ✅ getEmail():", sEmail, "(tipo:", typeof sEmail, ")");
                            } catch (e) {
                                console.log("  ❌ getEmail() falló:", e.message);
                            }
                            
                            // getFullName()
                            try {
                                sFullName = oUserInfoService.getFullName();
                                console.log("  ✅ getFullName():", sFullName, "(tipo:", typeof sFullName, ")");
                            } catch (e) {
                                console.log("  ❌ getFullName() falló:", e.message);
                            }
                            
                            // getFirstName()
                            try {
                                sFirstName = oUserInfoService.getFirstName();
                                console.log("  ✅ getFirstName():", sFirstName, "(tipo:", typeof sFirstName, ")");
                            } catch (e) {
                                console.log("  ❌ getFirstName() falló:", e.message);
                            }
                            
                            // getLastName()
                            try {
                                sLastName = oUserInfoService.getLastName();
                                console.log("  ✅ getLastName():", sLastName, "(tipo:", typeof sLastName, ")");
                            } catch (e) {
                                console.log("  ❌ getLastName() falló:", e.message);
                            }
                            
                            // Intentar propiedades directas
                            console.log("🔍 Propiedades directas del service:");
                            for (var prop in oUserInfoService) {
                                if (oUserInfoService.hasOwnProperty(prop)) {
                                    try {
                                        console.log("  - " + prop + ":", oUserInfoService[prop]);
                                    } catch (e) {
                                        console.log("  - " + prop + ": (error al acceder)");
                                    }
                                }
                            }
                            
                            // Intentar métodos adicionales
                            var additionalMethods = ['getUserName', 'getLanguage', 'getEmployeeNumber', 'getUser', 'getTheme'];
                            console.log("🔍 Intentando métodos adicionales:");
                            additionalMethods.forEach(function(method) {
                                try {
                                    if (typeof oUserInfoService[method] === 'function') {
                                        var value = oUserInfoService[method]();
                                        console.log("  ✅ " + method + "():", value);
                                    }
                                } catch (e) {
                                    // Silenciar errores
                                }
                            });
                            
                            console.log("📋 FLP UserInfo data completo:", {
                                id: sUserId,
                                email: sEmail,
                                fullName: sFullName,
                                firstName: sFirstName,
                                lastName: sLastName
                            });
                            
                            // Si tenemos al menos el ID, crear el objeto de usuario
                            if (sUserId || sEmail) {
                                var oUserInfo = {
                                    id: sUserId || sEmail || "",
                                    email: sEmail || "",
                                    name: sFullName || sEmail || sUserId || "",
                                    firstName: sFirstName || "",
                                    lastName: sLastName || "",
                                    fullName: sFullName || ""
                                };
                                
                                // If first/last names not provided, try to split full name
                                if (!oUserInfo.firstName && sFullName) {
                                    var aParts = sFullName.split(" ");
                                    if (aParts.length >= 2) {
                                        oUserInfo.firstName = aParts[0];
                                        oUserInfo.lastName = aParts.slice(1).join(" ");
                                    }
                                }
                                
                                console.log("✅ Usuario procesado de FLP UserInfo service:", oUserInfo);
                                console.log("✅ userId que se usará:", oUserInfo.id);
                                return oUserInfo;
                            } else {
                                console.log("❌ No se pudo obtener ID ni email del UserInfo service");
                                return null;
                            }
                        } else {
                            console.log("⚠️ UserInfo service returned null");
                            return null;
                        }
                    })
                    .catch(function(error) {
                        console.error("❌ Error obteniendo UserInfo service:", error);
                        console.error("  Stack:", error.stack);
                        return null;
                    });
            } else {
                console.log("ℹ️ No estamos en FLP/Work Zone");
                console.log("  - sap.ushell no disponible o Container no existe");
                return Promise.resolve(null);
            }
        },


        _debugStorage: function() {
            console.log("📦 SessionStorage keys:", Object.keys(sessionStorage));
            console.log("📦 LocalStorage keys:", Object.keys(localStorage));
            
            // Check for any JWT-like tokens
            var aTokenKeys = [];
            for (var key in sessionStorage) {
                var value = sessionStorage.getItem(key);
                if (value && (value.startsWith('ey') || key.toLowerCase().includes('token') || key.toLowerCase().includes('auth'))) {
                    aTokenKeys.push(key);
                    console.log("🔑 Posible token en sessionStorage:", key, "=", value.substring(0, 50) + "...");
                }
            }
            
            for (var key in localStorage) {
                var value = localStorage.getItem(key);
                if (value && (value.startsWith('ey') || key.toLowerCase().includes('token') || key.toLowerCase().includes('auth'))) {
                    aTokenKeys.push(key);
                    console.log("🔑 Posible token en localStorage:", key, "=", value.substring(0, 50) + "...");
                }
            }
            
            // Check cookies
            console.log("🍪 Cookies:", document.cookie);
            
            if (aTokenKeys.length === 0) {
                console.log("⚠️ No se encontraron tokens en storage");
            }
        },

        /**
         * Try to extract user from JWT token
         * @private
         * @returns {Object|null} User info or null
         */
        _getUserFromToken: function() {
            console.log("🔐 Intentando obtener usuario del token XSUAA...");
            
            // Try different storage locations
            var aLocations = [
                { storage: sessionStorage, name: "sessionStorage" },
                { storage: localStorage, name: "localStorage" }
            ];
            
            for (var i = 0; i < aLocations.length; i++) {
                var oLoc = aLocations[i];
                
                for (var key in oLoc.storage) {
                    try {
                        var value = oLoc.storage.getItem(key);
                        
                        // Check if it looks like a JWT (starts with 'ey' and has 3 parts)
                        if (value && value.startsWith('ey') && value.split('.').length === 3) {
                            console.log("📝 Token encontrado en:", oLoc.name, "key:", key);
                            
                            var parts = value.split('.');
                            var payload = JSON.parse(atob(parts[1]));
                            
                            console.log("📋 Token payload completo:", payload);
                            
                            // Extract user info
                            var oUserInfo = {
                                id: payload.email || payload.user_name || payload.name || payload.sub || "",
                                email: payload.email || payload.mail || "",
                                name: payload.given_name && payload.family_name
                                    ? payload.given_name + " " + payload.family_name
                                    : payload.name || payload.email || "",
                                firstName: payload.given_name || "",
                                lastName: payload.family_name || "",
                                fullName: payload.name || 
                                         (payload.given_name && payload.family_name 
                                             ? payload.given_name + " " + payload.family_name 
                                             : payload.email || "")
                            };
                            
                            console.log("✅ Usuario extraído del token:", oUserInfo);
                            return oUserInfo;
                        }
                    } catch (e) {
                        // Token no válido o error al parsear, continuar
                        console.log("⚠️ Error parseando token de", key, ":", e.message);
                    }
                }
            }
            
            console.log("❌ No se encontró token XSUAA válido");
            return null;
        },

        /**
         * Fetch user from User API
         * @private
         * @returns {Promise} Promise with user info
         */
        _fetchUserFromAPI: function() {
            return fetch("/user-api/currentUser", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(function(response) {
                console.log("📥 User API response status:", response.status);
                if (!response.ok) {
                    console.error("❌ User API error:", response.status, response.statusText);
                    throw new Error("User API returned " + response.status);
                }
                return response.json();
            })
            .then(function(oUserData) {
                console.log("✅ User API response:", oUserData);
                
                // Extract relevant user information
                this._oUserInfo = {
                    id: oUserData.email || oUserData.name || "",
                    email: oUserData.email || "",
                    name: oUserData.firstname && oUserData.lastname 
                        ? oUserData.firstname + " " + oUserData.lastname 
                        : oUserData.name || oUserData.email || "",
                    firstName: oUserData.firstname || "",
                    lastName: oUserData.lastname || "",
                    fullName: oUserData.displayName || 
                              (oUserData.firstname && oUserData.lastname 
                                  ? oUserData.firstname + " " + oUserData.lastname 
                                  : oUserData.name || oUserData.email || "")
                };
                
                console.log("📋 Processed user info:", this._oUserInfo);
                return this._oUserInfo;
            }.bind(this))
            .catch(function(error) {
                console.error("❌ Error fetching from User API:", error);
                throw error;
            });
        },

        /**
         * Clear cached user info (useful for testing or logout scenarios)
         */
        clearUserCache: function() {
            this._oUserInfo = null;
            console.log("🗑️ User cache cleared");
        },

        /**
         * Fetch CSRF Token from backend
         * @private
         * @returns {Promise} Promise with CSRF token
         */
        _fetchCsrfToken: function() {
            // If we already have a token, return it
            if (this._sCsrfToken) {
                return Promise.resolve(this._sCsrfToken);
            }

            // Fetch CSRF token with GET request (some backends don't support HEAD)
            var sUrl = this._sBaseUrl + "/http/cancelAssignments";
            
            console.log("🔐 Fetching CSRF Token from:", sUrl);
            
            return fetch(sUrl, {
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                }
            })
            .then(function(response) {
                console.log("📥 Token Fetch Response:", {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                });
                
                var sToken = response.headers.get("X-CSRF-Token");
                if (sToken) {
                    console.log("✅ CSRF Token obtained:", sToken.substring(0, 20) + "...");
                    this._sCsrfToken = sToken;
                    return sToken;
                } else {
                    console.log("⚠️ No CSRF Token in response headers, proceeding without it");
                    return null;
                }
            }.bind(this))
            .catch(function(error) {
                console.error("❌ Error fetching CSRF Token:", error);
                // Continue without token
                return null;
            });
        },

        /**
         * Get quota overview for the week
         * Endpoint: POST /http/api/quota/overview
         * @param {string} sUserId - User ID (x-user-id en body)
         * @param {string} sWeekStartDate - Week start date in ISO format
         * @returns {Promise} Promise with the response
         */
        getQuotaOverview: function(sUserId, sWeekStartDate) {
            console.log("📡 Calling getQuotaOverview with:", {
                userId: sUserId,
                weekStartDate: sWeekStartDate,
                url: this._sBaseUrl + "/http/api/quota/overview"
            });
            return this._callService("/http/api/quota/overview", "POST", {
                "x-user-id": sUserId,
                "weekStartDate": sWeekStartDate
            });
        },

        /**
         * Save assignments
         * Endpoint: POST /http/saveAssignments
         * @param {string} sEmployeeId - Employee ID
         * @param {Array} aAssignments - Array of assignments
         * @returns {Promise} Promise with the response
         */
        saveAssignments: function(sEmployeeId, aAssignments) {
            console.log("📡 Calling saveAssignments with:", {
                employeeId: sEmployeeId,
                assignmentsCount: aAssignments.length,
                url: this._sBaseUrl + "/http/saveAssignments"
            });
            return this._callService("/http/saveAssignments", "POST", {
                "employeeId": sEmployeeId,
                "assignments": aAssignments
            });
        },

        /**
         * Get my assignments
         * Endpoint: GET /http/myAssignments?employeeId={id}&weekStartDate={date}
         * @param {string} sEmployeeId - Employee ID
         * @param {string} sWeekStartDate - Week start date in ISO format
         * @returns {Promise} Promise with the response
         */
        getMyAssignments: function(sEmployeeId, sWeekStartDate) {
            var sEndpoint = "/http/myAssignments?employeeId=" + 
                            encodeURIComponent(sEmployeeId) + 
                            "&weekStartDate=" + encodeURIComponent(sWeekStartDate);
            
            console.log("📡 Calling getMyAssignments with:", {
                employeeId: sEmployeeId,
                weekStartDate: sWeekStartDate,
                endpoint: sEndpoint
            });
            
            return this._callService(sEndpoint, "GET", null);
        },

        /**
         * Cancel assignments
         * Endpoint: POST /http/cancelAssignments
         * @param {string} sEmployeeId - Employee ID
         * @param {Array} aCancellations - Array of cancellations
         * @returns {Promise} Promise with the response
         */
        cancelAssignments: function(sEmployeeId, aCancellations) {
            console.log("📡 Calling cancelAssignments with:", {
                employeeId: sEmployeeId,
                cancellationsCount: aCancellations.length,
                url: this._sBaseUrl + "/http/cancelAssignments"
            });
            return this._callService("/http/cancelAssignments", "POST", {
                "employeeId": sEmployeeId,
                "cancellations": aCancellations
            });
        },

        /**
         * Internal method to call service
         * @private
         */
        _callService: function(sEndpoint, sMethod, oData) {
            var sUrl = this._sBaseUrl + sEndpoint;
            
            console.log("🌐 Fetch Request:", {
                url: sUrl,
                method: sMethod,
                data: oData
            });

            // For POST, PUT, DELETE methods, fetch CSRF token first
            if (sMethod === "POST" || sMethod === "PUT" || sMethod === "DELETE") {
                return this._fetchCsrfToken().then(function(sToken) {
                    var oHeaders = {
                        "Content-Type": "application/json"
                    };
                    
                    // Add CSRF token if available
                    if (sToken) {
                        oHeaders["X-CSRF-Token"] = sToken;
                        console.log("🔐 Including CSRF Token in request");
                    }

                    return fetch(sUrl, {
                        method: sMethod,
                        headers: oHeaders,
                        body: JSON.stringify(oData)
                    })
                    .then(function(response) {
                        console.log("📥 Fetch Response:", {
                            status: response.status,
                            statusText: response.statusText,
                            ok: response.ok
                        });
                        
                        // If 403, token might be expired, reset it
                        if (response.status === 403) {
                            console.log("⚠️ 403 Forbidden - resetting CSRF token");
                            this._sCsrfToken = null;
                        }
                        
                        return this._handleResponse(response);
                    }.bind(this))
                    .catch(function(error) {
                        console.error("❌ Fetch Error:", error);
                        throw error;
                    });
                }.bind(this));
            } else {
                // For GET requests, no CSRF token needed
                return fetch(sUrl, {
                    method: sMethod,
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
                .then(function(response) {
                    console.log("📥 Fetch Response:", {
                        status: response.status,
                        statusText: response.statusText,
                        ok: response.ok
                    });
                    return this._handleResponse(response);
                }.bind(this))
                .catch(function(error) {
                    console.error("❌ Fetch Error:", error);
                    throw error;
                });
            }
        },

        /**
         * Handle response from service
         * @private
         */
        _handleResponse: function(response) {
            // Always try to parse as JSON first since our backend returns JSON
            return response.text().then(function(text) {
                console.log("📦 Raw response text:", text);
                
                var data;
                try {
                    data = JSON.parse(text);
                    console.log("✅ Parsed JSON data:", data);
                } catch (e) {
                    console.error("❌ Failed to parse JSON:", e);
                    console.error("Raw text:", text);
                    return Promise.reject({
                        status: response.status,
                        message: "Error parsing JSON response"
                    });
                }
                
                if (!response.ok) {
                    // Check if it's a business error (like no children)
                    if (data.error) {
                        return Promise.reject({
                            businessError: true,
                            error: data.error
                        });
                    }
                    return Promise.reject({
                        status: response.status,
                        message: data.message || "Error en la solicitud"
                    });
                }
                
                return data;
            });
        }
    });
});


