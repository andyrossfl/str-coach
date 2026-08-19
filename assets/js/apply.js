(function () {
	'use strict';

	// --- Paste your links here ------------------------------------------------
	var CONFIG = {
		// Calendly event URL (the specific event, not your profile homepage).
		// Example: 'https://calendly.com/your-link/strategy-call'
		calendlyUrl: 'https://calendly.com/andrew-ross-fl/30min',

		// Optional. Formspree endpoint so applications also land in your inbox.
		// Example: 'https://formspree.io/f/xxxxxxxx'
		formEndpoint: 'https://formspree.io/f/mkjwpany'
	};
	// --------------------------------------------------------------------------

	var form = document.getElementById('strategy-form');
	var formPanel = document.getElementById('apply-form-panel');
	var calendarPanel = document.getElementById('apply-calendar-panel');
	var calendlyMount = document.getElementById('calendly-embed');
	var calendarReady = document.getElementById('calendar-ready');
	var calendarFallback = document.getElementById('calendar-fallback');

	if (!form || !formPanel || !calendarPanel) {
		return;
	}

	function readForm(el) {
		var data = {};
		var fields = el.querySelectorAll('input, select, textarea');
		Array.prototype.forEach.call(fields, function (field) {
			if (!field.name || field.name === '_gotcha') {
				return;
			}
			data[field.name] = (field.value || '').trim();
		});
		return data;
	}

	function isHoneypotFilled(el) {
		var trap = el.querySelector('[name="_gotcha"]');
		return trap && trap.value;
	}

	function isCalendlyConfigured() {
		var url = CONFIG.calendlyUrl || '';
		return url.indexOf('calendly.com') !== -1;
	}

	function calendlyUrlWithPrefill(data) {
		var url = CONFIG.calendlyUrl;
		var glue = url.indexOf('?') === -1 ? '?' : '&';
		return url + glue +
			'name=' + encodeURIComponent(data.name || '') +
			'&email=' + encodeURIComponent(data.email || '');
	}

	function sendLead(data) {
		if (!CONFIG.formEndpoint) {
			return Promise.resolve();
		}

		var body = new FormData();
		Object.keys(data).forEach(function (key) {
			body.append(key, data[key]);
		});

		return fetch(CONFIG.formEndpoint, {
			method: 'POST',
			body: body,
			headers: { 'Accept': 'application/json' }
		}).catch(function () {
			// Still show the calendar even if the inbox post fails.
		});
	}

	function loadCalendlyScript() {
		return new Promise(function (resolve, reject) {
			if (window.Calendly) {
				resolve();
				return;
			}

			var existing = document.querySelector('script[src*="assets.calendly.com"]');
			if (existing) {
				existing.addEventListener('load', resolve);
				existing.addEventListener('error', reject);
				return;
			}

			var script = document.createElement('script');
			script.src = 'https://assets.calendly.com/assets/external/widget.js';
			script.async = true;
			script.onload = resolve;
			script.onerror = reject;
			document.body.appendChild(script);
		});
	}

	function showCalendar(data) {
		formPanel.hidden = true;
		calendarPanel.hidden = false;
		calendarPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

		if (!isCalendlyConfigured()) {
			calendarReady.hidden = true;
			calendarFallback.hidden = false;
			calendlyMount.hidden = true;
			return;
		}

		calendarReady.hidden = false;
		calendarFallback.hidden = true;
		calendlyMount.hidden = false;
		calendlyMount.innerHTML = '';

		loadCalendlyScript().then(function () {
			if (!window.Calendly || !window.Calendly.initInlineWidget) {
				calendarReady.hidden = true;
				calendarFallback.hidden = false;
				calendlyMount.hidden = true;
				return;
			}

			window.Calendly.initInlineWidget({
				url: calendlyUrlWithPrefill(data),
				parentElement: calendlyMount,
				prefill: {
					name: data.name,
					email: data.email
				}
			});
		}).catch(function () {
			calendarReady.hidden = true;
			calendarFallback.hidden = false;
			calendlyMount.hidden = true;
		});
	}

	form.addEventListener('submit', function (event) {
		event.preventDefault();

		if (isHoneypotFilled(form)) {
			return;
		}

		if (!form.reportValidity()) {
			return;
		}

		var data = readForm(form);
		var submit = form.querySelector('[type="submit"]');
		if (submit) {
			submit.disabled = true;
			submit.value = 'Submitting...';
		}

		sendLead(data);
		showCalendar(data);
	});
})();
