sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("sap.support.zglacelx.controller.Elements", {

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
			var headerLen = 0;
			var systemLen = 0;
			var partLen = 0;
			var resLen = 0;

			for (var i = 0; i < _rawModelData.children.length; ++i) {
				switch (_rawModelData.children[i].tagName) {
				case "Header":					
					headerLen = 1;
					break;
				case "Systems":
					systemLen = _rawModelData.children[i].children.length;	
					break;
				case "Parts":
					partLen = _rawModelData.children[i].children.length;							
					break;
				case "Results":
					resLen = _rawModelData.children[i].children.length;
					break;
				}
			}

			// set Header properties
			oHeaderTile.setHeader(jQuery.sap.formatMessage(
				resourceBundle.getText("elements.tiles.header.title.N"),
				headerLen));
			oHeaderTile.setPressEnabled(headerLen > 0);			
			if (headerLen == 0) {
				oHeaderTile.setFailedText(resourceBundle.getText("elements.tiles.header.na.info"));
				oHeaderTile.setState("Failed");				
			} else { 
				oHeaderTile.setState("Loaded");				
			}

			// set System properties
			oSystemsTile.setHeader(jQuery.sap.formatMessage(
				resourceBundle.getText("elements.tiles.systems.title.N"),
				systemLen));
			oSystemsTile.setPressEnabled(systemLen > 0);
			oPartsTile.setVisible(systemLen > 0);
			oResultsTile.setVisible(systemLen > 0);
			
			if (systemLen == 0) {				
				oSystemsTile.setFailedText(resourceBundle.getText("elements.tiles.systems.na.info"));
				oSystemsTile.setState("Failed");	
			} else {
				oSystemsTile.setState("Loaded");					
			}

			// set Part properties
			oPartsTile.setHeader(jQuery.sap.formatMessage(
				resourceBundle.getText("elements.tiles.parts.title.N"),
				partLen));					
			oPartsTile.setPressEnabled(partLen > 0);
			if (partLen > 0) {
				oPartsTile.setState("Loaded");
			} else {
				oPartsTile.setState("Failed");
				oPartsTile.setFailedText(resourceBundle.getText("elements.tiles.parts.na.info"));
			}

			// set Result properties
			oResultsTile.setHeader(jQuery.sap.formatMessage(
				resourceBundle.getText("elements.tiles.results.title.N"),
				resLen));			
			oResultsTile.setPressEnabled(resLen > 0 && partLen > 0);

			oXmlTile.setVisible(headerLen > 0 && systemLen > 0);
		},

		onToHeader: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("header");
		},

		onToIntro: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("intro");
		},
		
		onShowXML: function () {
			var sapMLib = sap.m.URLHelper.redirect(	"#/Xml", /* use pattern "Xml" defined in the route section of the manifest.json */
													true); /* true: open in new windows */
			sap.ui.require(	[ "sap/m/library" ], sapMLib);
			// var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			// oRouter.navTo("xmlcode");
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