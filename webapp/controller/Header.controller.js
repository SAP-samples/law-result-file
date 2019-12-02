sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"./layout/EqualWidthColumns"

], function (BaseController, formatter, Filter, FilterOperator, EqualWidthColumns) {
	"use strict";

	return BaseController.extend("glacelx.glacelx.controller.Header", {
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this._checkInitialModel();
			this._oModel = this.getOwnerComponent().getModel("userXML");
			this.oView = this.getView();
			this.oView.setModel(this._oModel);
			this.sCoreBindingPath = "/Header/";

			// bind form
			var _oHeaderForm = this.oView.byId("headerForm");
			_oHeaderForm.bindElement(this.sCoreBindingPath);

			// set code editor context
			var _mainModelRaw = this._oModel.getData().children[0];
			var _rawSystemData = _mainModelRaw._tagMeasurementHeaderHook;
			var _oCodeEditor = this.byId("headerCodeEditor");
			this.buildEditorContext(_rawSystemData, _oCodeEditor);
		},

		navToNext: function () {
			this.oRouter.navTo("system", {
				sysIndex: 0
			});
		},

		onElements: function () {
			this.oRouter.navTo("elements");
		}
	});
});