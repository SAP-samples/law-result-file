sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("sap.support.zglacelx.controller.XmlCode", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.support.zglacelx.view.XmlCode
		 */
		onInit: function () {
			this._checkInitialModel();
			this._oModel = this.getOwnerComponent().getModel("userXML");

			// set code editor context
			var _mainModelRaw = this._oModel.getData().children[0];
			var _oCodeEditor = this.byId("headerCodeEditor");
			_oCodeEditor.setHeight("100%");
			this.buildEditorContextSized(_mainModelRaw, _oCodeEditor, false);
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf sap.support.zglacelx.view.XmlCode
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf sap.support.zglacelx.view.XmlCode
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf sap.support.zglacelx.view.XmlCode
		 */
		//	onExit: function() {
		//
		//	}

	});

});