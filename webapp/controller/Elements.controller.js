sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("glacelx.glacelx.controller.Elements", {

		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRoute = this.oRouter.getRoute("elements");
			this.oRoute.attachMatched(this._onRouteMatched, this);
			this._checkInitialModel();
		},

		_onRouteMatched: function () {
			var oHeaderTile = this.byId("tileHeader");
			var oSystemsTile = this.byId("tileSystems");
			var oPartsTile = this.byId("tileParts");
			var oResultsTile = this.byId("tileResults");
			var oXmlTile = this.byId("tileXml");
			var _oModel = this.getOwnerComponent().getModel("userXML");
			var _rawModelData = _oModel.getData().children[0];

			for (var i = 0; i < _rawModelData.children.length; ++i) {
				switch (_rawModelData.children[i].tagName) {
				case "Header":
					oHeaderTile.setNumber(1);
					break;
				case "Systems":
					oSystemsTile.setNumber(_rawModelData.children[i].children.length);
					break;
				case "Parts":
					oPartsTile.setNumber(_rawModelData.children[i].children.length);
					break;
				case "Results":
					oResultsTile.setNumber(_rawModelData.children[i].children.length);
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