sap.ui.define([
	"./BaseController",
	"sap/base/Log",

], function (BaseController, Log) {
	"use strict";

	return BaseController.extend("sap.support.zglacelx.controller.Systems", {

		onInit: function () {
			this._checkInitialModel();
			var _oModel = this.getOwnerComponent().getModel("userXML");
			this.getView().setModel(_oModel);
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

		onAfterRendering: function () {
			var ul = this.getView().byId("systemList");
			var items = ul.getItems();
			for (var index in items) {
				items[index].addStyleClass("lineBreak");
			}
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
		}
	});
});