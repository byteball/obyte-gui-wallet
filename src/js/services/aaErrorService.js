'use strict';

angular.module('copayApp.services').factory('aaErrorService', function() {
	var root = {};

	var ERROR_TYPES = {
		UNKNOWN: 'unknown',
		STRING: 'string',
		XPATH: 'xpath',
		CODE_LINES: 'codeLines',
		CALL_CHAIN: 'callChain',
		OBJECT: 'object'
	};

	function getErrorType(parsed) {
		if (!parsed || !parsed.error) return ERROR_TYPES.UNKNOWN;
		if (typeof parsed.error === 'string') return ERROR_TYPES.STRING;
		
		var keys = Object.keys(parsed.error);
		if (keys.indexOf('callChain') !== -1) return ERROR_TYPES.CALL_CHAIN;
		if (keys.indexOf('codeLines') !== -1) return ERROR_TYPES.CODE_LINES;
		if (keys.indexOf('xpath') !== -1) return ERROR_TYPES.XPATH;
		
		return ERROR_TYPES.OBJECT;
	}

	function extractCallChain(obj, result) {
		if (!result) result = { addresses: [], nestedError: null };
		if (!obj) return result;

		if (obj.address) {
			result.addresses.push(obj.address);
		}

		if (obj.message) {
			result.nestedError = {
				message: obj.message,
				formattedContext: obj.formattedContext || '',
				codeLines: obj.codeLines || [],
				trace: obj.trace || []
			};
			if (!obj.next) return result;
		}

		if (obj.next) {
			if (typeof obj.next === 'object' && obj.next['0'] !== undefined) {
				var errorText = '';
				for (var i = 0; obj.next[String(i)] !== undefined; i++) {
					errorText += obj.next[String(i)];
				}
				result.nestedError = { message: errorText };
				if (obj.next.address) {
					result.addresses.push(obj.next.address);
				}
			} else {
				extractCallChain(obj.next, result);
			}
		}
		return result;
	}

	function parseAAResponse(response) {
		var parsed;
		if (typeof response === 'string') {
			try {
				parsed = JSON.parse(response);
			} catch (e) {
				parsed = { error: response };
			}
		} else {
			parsed = response || {};
		}

		var errorType = getErrorType(parsed);
		var hasError = !!parsed.error;
		var error = parsed.error;

		var result = {
			parsed: parsed,
			errorType: errorType,
			hasError: hasError,
			message: '',
			details: {}
		};

		if (!hasError) return result;

		if (typeof error === 'string') {
			result.message = error;
			return result;
		}

		result.message = error.message || '';

		if (errorType === ERROR_TYPES.XPATH) {
			result.details = { xpath: error.xpath };
		} else if (errorType === ERROR_TYPES.CALL_CHAIN) {
			var chainData = extractCallChain(error.callChain);
			if (chainData.nestedError && chainData.nestedError.message) {
				result.message += chainData.nestedError.message;
			}
			result.details = {
				addresses: chainData.addresses,
				formattedContext: chainData.nestedError ? chainData.nestedError.formattedContext || '' : '',
				codeLines: chainData.nestedError ? chainData.nestedError.codeLines || [] : [],
				trace: chainData.nestedError ? chainData.nestedError.trace || [] : []
			};
		} else if (errorType === ERROR_TYPES.CODE_LINES) {
			result.details = {
				formattedContext: error.formattedContext || '',
				codeLines: error.codeLines || [],
				trace: error.trace || []
			};
		} else if (errorType === ERROR_TYPES.OBJECT) {
			result.details = { raw: error };
		}

		return result;
	}

	function prettifyJson(obj) {
		try {
			return JSON.stringify(obj, null, 2);
		} catch (e) {
			return String(obj);
		}
	}

	function getAddressForTrace(trace, traceIndex) {
		if (!trace || !trace.length || traceIndex < 0) return null;
		
		for (var i = traceIndex; i >= 0; i--) {
			if (trace[i].aa) {
				return trace[i].aa;
			}
		}
		return null;
	}

	function getLastTrace(trace) {
		if (!trace || !trace.length) return null;
		return trace[trace.length - 1];
	}

	root.ERROR_TYPES = ERROR_TYPES;
	root.parseAAResponse = parseAAResponse;
	root.prettifyJson = prettifyJson;
	root.getAddressForTrace = getAddressForTrace;
	root.getLastTrace = getLastTrace;

	return root;
});
