sap.ui.define([
	"./BaseController",
	"sap/base/Log",

], function (BaseController, Log) {
	"use strict";

	return BaseController.extend("sap.support.zglacelx.Component.controller.Systems", {

		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRoute = this.oRouter.getRoute("systems");
			this._checkInitialModel();
			this.oView = this.getView();
			this.oRoute.attachMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function () {
			var oEmptyModel = new sap.ui.model.json.JSONModel();
			var _oModel = this.getOwnerComponent().getModel("userXML");
			this.oView.setModel(oEmptyModel);
			this.oView.setModel(_oModel);
			
		},
		onToAll: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("elements");
		},

		onSystemPressed: function (oEvent) {
			var oItem = oEvent.getSource();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oContextPath = oItem.getBindingContextPath();
			var sysIdx = oContextPath.substr("/Systems/System/".length);
			oRouter.navTo("system", {
				sysIndex: sysIdx
			});
		},

		onBeforeRendering: function () {
			var ul = this.getView().byId("systemList");

			var items = ul.getItems();
			for (var index in items) {
				items[index].addStyleClass("lineBreak");
			}

			this.prepareConsButton();
		},

		onSystemUpdate: function () {
			var ul = this.getView().byId("systemList");
			var items = ul.getItems();
			for (var index in items) {
				items[index].addStyleClass("lineBreak");
			}
		},

		getAppObject: function () {
			var result = this.byId("systemListApp");
			if (!result) {
				Log.error("systemListApp object can't be found");
			}
			return result;
		},

		onLiveChange: function (oEvent) {
			var aFilters = [];
			var sQuery = oEvent.getParameters().newValue;
			// add filter for search
			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter([
					new sap.ui.model.Filter("SAP_SID", sap.ui.model.FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("SystemNo", sap.ui.model.FilterOperator.Contains, sQuery),
					new sap.ui.model.Filter("InstallationNo", sap.ui.model.FilterOperator.Contains, sQuery)
				], false);
				aFilters.push(filter);
			}
			// update list binding
			var oBinding = this.getView().byId("systemList").getBinding("items");
			oBinding.filter(aFilters);
		},

		/* Hides the "Access consolidation" button if no consolidation part is found;
		   Shows the button and stores the index of the part if a consolidation part is found */
		prepareConsButton: function () {

			// search part for a <name>LAW-Consolidation</name> entry
			var _mainModelRaw = this.getOwnerComponent().getModel("userXML").getData().children[0];
			var curPartNode, curName;
			if (_mainModelRaw._tagMeasurementPartsHook) {
				for (var i = _mainModelRaw._tagMeasurementPartsHook.childElementCount - 1; i >= 0; i--) {
					curPartNode = _mainModelRaw._tagMeasurementPartsHook.children[i];
					for (var c = 0; c < curPartNode.childElementCount; c++) {
						if (curPartNode.children[c].tagName === "Name") {
							if (curPartNode.children[c].innerHTML.trim().toUpperCase() === "LAW-CONSOLIDATION") {
								// console.log("Found consolidation in part " +  c);
								this.byId("consButton").setVisible(true);
								this._consPart = i;
								return;
							} else {
								// console.log("Ignroe Part with name " + curPartNode.children[c].innerHTML);
							}
						}
					}
				}
			}
			// no consolidation part found -> disable button			
			this.byId("consButton").setVisible(false);

		},

		onConsButton: function () {
			// console.log("Navigate to part" + this._consPart);		
			var target = this._getIdsForPartIndex(this._consPart);
			if (target[0] != -1 && target[1] != -1) {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("part", {
					sysIndex: target[0],
					partIndex: target[1],
				});
			} else {
				// navigate to an error page with the option to navigate to the Elements.view
			}
		}
	});
});