'use strict';

angular.module('copayApp.services').factory('aaDocService', function() {

	var root = {};

	// cache of downloaded docs
	var docsByUrl = {};

	function getAADocs(aa_address, strDefinition, handleDoc) {
		var arrBaseDefinition = JSON.parse(strDefinition);
		var doc_url = arrBaseDefinition[1].doc_url;
		if (!doc_url)
			return handleDoc();
		// allow other protocols, e.g. ipfs
		doc_url = doc_url.replace(/{{aa_address}}/g, aa_address);
		if (docsByUrl[doc_url])
			return handleDoc(docsByUrl[doc_url]);
		require('ocore/uri.js').fetchUrl(doc_url, function (err, response) {
			if (err) {
				console.log("fetching doc_url failed: " + err);
				return handleDoc();
			}
			try {
				var doc = JSON.parse(response);
				docsByUrl[doc_url] = doc;
			}
			catch (e) {
				console.log("failed to parse doc_url response: " + e + ", the response was: " + response);
			}
			handleDoc(doc);
		});
	}

	root.getAADocs = getAADocs;

	

	return root;
});
