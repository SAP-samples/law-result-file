sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("glacelx.glacelx.controller.Elements", {

		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRoute = this.oRouter.getRoute("elements");
			this._checkInitialModel();
			this.oRoute.attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function () {
			var oHeaderTile = this.byId("tileHeader");
			var oSystemsTile = this.byId("tileSystems");
			var oPartsTile = this.byId("tileParts");
			var oResultsTile = this.byId("tileResults");
			var oXmlTile = this.byId("tileXml");
			var _oModel = this.getOwnerComponent().getModel("userXML");
			var _rawModelData = _oModel.getData().children[0];

			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();

			for (var i = 0; i < _rawModelData.children.length; ++i) {
				switch (_rawModelData.children[i].tagName) {
				case "Header":
					oHeaderTile.setHeader(jQuery.sap.formatMessage(
												resourceBundle.getText("elements.tiles.header.title.N"),
												1));
					break;
				case "Systems":
					oSystemsTile.setHeader(jQuery.sap.formatMessage(
												resourceBundle.getText("elements.tiles.systems.title.N"),
												_rawModelData.children[i].children.length));
					break;
				case "Parts":
					oPartsTile.setHeader(jQuery.sap.formatMessage(
												resourceBundle.getText("elements.tiles.parts.title.N"),
												_rawModelData.children[i].children.length));
					break;
				case "Results":
					oResultsTile.setHeader(jQuery.sap.formatMessage(
												resourceBundle.getText("elements.tiles.results.title.N"),
												_rawModelData.children[i].children.length));
					break;
				}
			}
		},

		onToHeader: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("header");
		},

		onToIntro: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("intro");
		},

		onSystemList: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("systems");
		},

		onFirstSystem: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);			
			var sysIdx = "1";
			oRouter.navTo("system", {
				sysIndex: sysIdx
			});
		},

		onFirstPart: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var resultId  = "1";			
			oRouter.navTo("resultid", {
				resultId: resultId				
			});
		},

		onPartPressed: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var partIdx = "1";
			var sysIdx = "1";
			oRouter.navTo("part", {
				sysIndex: sysIdx,
				partIndex: partIdx
			});
		}
	});
});