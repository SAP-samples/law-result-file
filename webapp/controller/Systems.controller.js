sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/base/Log",
	
], function (Controller, Log) {
	"use strict";

	return Controller.extend("glacelx.glacelx.controller.Systems", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf glacelx.glacelx.view.Systems
		 */
		onInit: function () {

		},
		
		onToAll: function () {
   			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("elements");   			
   		},
   		
   		onSystemPressed: function (oEvent) {
   			var oItem = oEvent.getSource();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			var oContext = oItem.getBindingContext("lawFile");
			var sysIdx = oContext.getPath();
			sysIdx = sysIdx.substr("/Systems/".length);

			// could select System with properties like SAP_SID, SystemNo, ...
			// var selectedSyst = oCtx.getObject();
 			oRouter.navTo("system",{
				sysIndex: sysIdx
				// SystemNo: oCtx.getProperty("SystemNo")
			}); 

/*
   			var oItem, oCtx;
			oItem = oEvent.getSource();
			oCtx = oItem.getBindingContext("lawFile");
   			
			var oItem = oEvent.getSource();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var ctx = oItem.getBindingContext("lawFile");
			var path = ctx.getPath().substr(1); // remove leading /; example for result: "Systems/31"
			var id = path.substr(9);

			oRouter.navTo("parts", {
				SystNo: id
			}); */
   		},
   		
   		onAfterRendering: function() {
			var oSysApp = this.getAppObject(),
				ref = oSysApp.getDomRef() && oSysApp.getDomRef().parentNode;
			// set all parent elements to 100% height, this should be done by app developer, but just in case
			if (ref && !ref._sapUI5HeightFixed) {
				ref._sapUI5HeightFixed = true;
				while (ref && ref !== document.documentElement) {
					var $ref = jQuery(ref);
					if ($ref.attr("data-sap-ui-root-content")) { // Shell as parent does this already
						break;
					}
					if (!ref.style.height) {
						ref.style.height = "100%";
					}
					ref = ref.parentNode;
				}
			}
		},
   		
   		getAppObject : function() {
			var result = this.byId("systemListApp");
			if (!result) {
				Log.error("systemListApp object can't be found");
			}
			return result;
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf glacelx.glacelx.view.Systems
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf glacelx.glacelx.view.Systems
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf glacelx.glacelx.view.Systems
		 */
		//	onExit: function() {
		//
		//	}

	});

});