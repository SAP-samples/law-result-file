sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/base/Log"
], function (Controller, UIComponent, JSONModel, MessageToast, Log) {
	"use strict";

	return Controller.extend("glacelx.glacelx.controller.BaseController", {
		onInit: function () {
			
		},

		_xmlModelBranchContains: function(oBranch, sNamedChild) {
			return false;
		},
		
        __convertModelToString: function(head) {
			var _retString = "";
			
			// leaf nodes
			if(!head.children || head.children.length === 0) {
				var _sLTabSpace = "";
				for (var _dCount = 0; _dCount < head._tagDepth; ++_dCount) {
					_sLTabSpace += "    ";
				}
				
				if(head.textContent != "") {
					_retString = _sLTabSpace + _retString + "<" + head.tagName + ">" + head.textContent + "</" + head.tagName + ">\n";
				}
				else {
					_retString = _sLTabSpace + _retString + "<" + head.tagName + "/>\n";
				}
				
				return _retString;
			}
			// parent node
			else if (head.children.length > 0) {
				var _sCTabSpace = "";
				for (var _eCount = 0; _eCount < head._tagDepth; ++_eCount) {
					_sCTabSpace += "    ";
				}
				_retString = _sCTabSpace + "<" + head.tagName + ">\n" + _retString;
				
				// call all children
				for (var i = 0; i < head.children.length; ++i) {
					_retString += this.__convertModelToString(head.children[i]);
				}
				
				_retString = _retString + _sCTabSpace + "</" + head.tagName + ">\n";
				return _retString;
			}
			else {
			}
		},

		buildEditorContext: function(head, oCodeEditor) {
			var _sXMAS = this.__convertModelToString(head);
			// remove last line break (otherwise we are left with an empty last line)
			_sXMAS = _sXMAS.slice(0, -1);
			
			// WARNING: This is a direct call to the ACE settings and might break
			// if the ACE interface changes. Reference:
			// https://github.com/ajaxorg/ace/wiki/Configuring-Ace#session-options
			oCodeEditor._oEditor.setOptions({
				firstLineNumber: head._tagLineStart
			});
			oCodeEditor.setValue(_sXMAS);
			oCodeEditor.setEditable(false);
			oCodeEditor.setType("xml");
		},
		
		_getCorrespondingSystem: function(iPartIndex) {
			var _iSysNo = this.getOwnerComponent().getModel("userXML").getProperty("/Parts/Part/" + iPartIndex + "/SystemNo");
			var systems = this.oModel.getData().children[0]._tagMeasurementSystemsHook.children;
			for (var i = 0; i<systems.length; ++i) {
				if (systems[i].children[0].textContent === _iSysNo) {
					return i;
				}
			}
			
			// if no system was found return -1
			return -1;
		}
	});
});