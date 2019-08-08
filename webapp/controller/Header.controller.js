sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"

], function (BaseController, formatter, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("glacelx.glacelx.controller.Header", {		
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oModel = this.getOwnerComponent().getModel("userXML");
			this.oView = this.getView();
            this.oView.setModel(this.oModel);
            this.sCoreBindingPath = "/Header/";

            // bind form
            var _oHeaderForm = this.oView.byId("headerForm");
            _oHeaderForm.bindElement(this.sCoreBindingPath);

            // set code editor context
			var _mainModelRaw = this.oModel.getData().children[0];
			var _rawSystemData = _mainModelRaw._tagMeasurementHeaderHook;
			var _oCodeEditor = this.byId("headerCodeEditor");
            this.buildEditorContext(_rawSystemData, _oCodeEditor);
        },
        
        navToNext: function() {
            this.oRouter.navTo("system", {
				sysIndex: 0
            });
        },

        onElements: function() {
            this.oRouter.navTo("elements");
        }
	});
});