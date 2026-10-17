/*
 * Form: from the AEM Block Collection (github.com/adobe/aem-block-collection).
 * Note: the Block Collection marks this block as deprecated.
 * Fields come from a JSON sheet (field, label, type, required, options, ...).
 * BNTS Commerce Starter change: with no submit URL, the form runs in demo mode
 * (validates, then shows a confirmation; nothing is sent). Styling rebuilt on
 * the drop-in design tokens.
 */
import { toCamelCase, toClassName } from '../../scripts/aem.js';

function createElement(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

function generateId(name, option = null) {
  const id = toCamelCase(name);
  return option ? `${id}-${toCamelCase(option)}` : id;
}

function writeHelpText(text, inputId) {
  const help = createElement('p', 'field-help-text');
  help.textContent = text;
  help.id = `${inputId}-help`;
  return help;
}

function buildLabel(text, type = 'label', id = null, required = false) {
  const label = createElement(type);
  label.textContent = text;
  if (id && type === 'label') label.setAttribute('for', id);
  if (required) label.dataset.required = 'true';
  return label;
}

function buildInput(field) {
  const {
    type, field: fieldName, required, default: defaultValue, placeholder,
  } = field;
  const input = createElement('input');
  input.type = type || 'text';
  input.id = generateId(fieldName);
  input.name = input.id;
  input.required = required === 'true';
  if (defaultValue) input.value = defaultValue;
  if (placeholder) input.placeholder = placeholder;
  return input;
}

function buildTextArea(field) {
  const {
    field: fieldName, required, default: defaultValue, placeholder,
  } = field;
  const textarea = createElement('textarea');
  textarea.id = generateId(fieldName);
  textarea.name = textarea.id;
  textarea.required = required === 'true';
  textarea.rows = 5;
  if (defaultValue) textarea.value = defaultValue;
  if (placeholder) textarea.placeholder = placeholder;
  return textarea;
}

function buildOptionInput(field, option) {
  const {
    type, field: fieldName, default: defaultValue, required,
  } = field;
  const id = generateId(fieldName, option);
  const input = createElement('input');
  input.type = type;
  input.id = id;
  input.name = generateId(fieldName);
  input.value = option;
  input.checked = option === defaultValue;
  input.required = required === 'true';
  return input;
}

function buildOptions(field, controlled) {
  const {
    type, options, label, required,
  } = field;
  if (!options) return null;
  const fieldset = createElement('fieldset', `form-field ${type}-field`);
  if (controlled) {
    const controller = controlled.split('-')[0];
    fieldset.dataset.controller = controller;
    fieldset.dataset.condition = controlled;
  }
  fieldset.append(buildLabel(label, 'legend', null, required === 'true'));
  options.split(',').forEach((o) => {
    const option = o.trim();
    const input = buildOptionInput(field, option);
    const span = createElement('span');
    const labelEl = buildLabel(option, 'label', input.id);
    labelEl.prepend(input, span);
    fieldset.append(labelEl);
  });
  return fieldset;
}

async function buildOptionsFromUrl(url) {
  const resp = await fetch(url);
  const { data } = await resp.json();
  return data.map((o) => {
    const { option, value } = o;
    const optionEl = createElement('option');
    if (option && value) {
      optionEl.value = value;
      optionEl.textContent = option;
    } else if (option && !value) {
      optionEl.value = option;
      optionEl.textContent = option;
    } else if (value && !option) {
      optionEl.value = value;
      optionEl.textContent = value;
    }
    return optionEl;
  });
}

function buildSelect(field, controlled) {
  const {
    type, options, field: fieldName, label, required, placeholder,
  } = field;
  if (!options) return null;
  const wrapper = createElement('div', `form-field ${type}-field`);
  if (controlled) {
    const controller = controlled.split('-')[0];
    wrapper.dataset.controller = controller;
    wrapper.dataset.condition = controlled;
  }
  wrapper.append(buildLabel(label, 'label', generateId(fieldName), required === 'true'));
  const select = createElement('select');
  select.id = generateId(fieldName);
  select.name = select.id;
  select.required = required === 'true';
  wrapper.append(select);
  if (placeholder) {
    const placeholderOption = createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.append(placeholderOption);
  }
  try {
    const url = new URL(options);
    buildOptionsFromUrl(url).then((os) => { select.append(...os); });
  } catch (error) {
    options.split(',').forEach((o) => {
      const option = o.trim();
      const optionEl = createElement('option');
      optionEl.value = option;
      optionEl.textContent = option;
      select.append(optionEl);
    });
  }
  return wrapper;
}

function buildToggle(field, controlled) {
  const { label, required, default: defaultValue } = field;
  const wrapper = createElement('div', 'form-field toggle-field');
  if (controlled) {
    const controller = controlled.split('-')[0];
    wrapper.dataset.controller = controller;
    wrapper.dataset.condition = controlled;
  }
  const input = buildOptionInput({ ...field, type: 'checkbox' }, defaultValue || 'true');
  input.setAttribute('role', 'switch');
  input.setAttribute('aria-checked', input.checked);
  input.addEventListener('change', () => { input.setAttribute('aria-checked', input.checked); });
  const span = createElement('span');
  const labelEl = buildLabel(label, 'label', input.id, required === 'true');
  labelEl.prepend(input, span);
  wrapper.append(labelEl);
  return wrapper;
}

function buildButton(field) {
  const { type, label } = field;
  const button = createElement('button');
  button.className = 'button';
  button.type = type;
  button.textContent = label;
  if (type === 'reset') button.classList.add('secondary');
  return button;
}

function toggleConditional(e, controllerConfig) {
  const { target } = e;
  const controller = target.name;
  if (controllerConfig.has(controller)) {
    const inputs = [...controllerConfig.get(controller)];
    inputs.forEach((i) => {
      const field = i.closest('.form-field');
      const { condition } = field.dataset;
      const conditionMet = condition.includes(toClassName(target.value));
      field.setAttribute('aria-hidden', !conditionMet);
      if (conditionMet) {
        if (i.dataset.originalRequired === 'true') i.setAttribute('required', '');
        i.removeAttribute('tabindex');
      } else {
        i.removeAttribute('required');
        i.setAttribute('tabindex', '-1');
      }
    });
  }
}

function initConditionals(form, controllerConfig) {
  controllerConfig.forEach((controlledInputs, controller) => {
    let controllerValue = null;
    const checked = form.querySelector(`[name="${controller}"]:checked`);
    const select = form.querySelector(`select[name="${controller}"]`);
    if (checked) controllerValue = checked.value;
    else if (select) controllerValue = select.value;
    controlledInputs.forEach((input) => {
      const field = input.closest('.form-field');
      const { condition } = field.dataset;
      const conditionMet = controllerValue ? condition.includes(toClassName(controllerValue)) : false;
      field.setAttribute('aria-hidden', !conditionMet);
      if (input.hasAttribute('required')) {
        if (!input.dataset.originalRequired) input.dataset.originalRequired = 'true';
        if (!conditionMet) input.removeAttribute('required');
      }
      if (conditionMet) input.removeAttribute('tabindex');
      else input.setAttribute('tabindex', '-1');
    });
  });
}

function enableConditionals(form) {
  const controlled = [...form.querySelectorAll('[data-controller]')];
  const controllerConfig = new Map();
  controlled.forEach((c) => {
    const input = c.querySelector('input, textarea, select');
    const { controller } = c.dataset;
    if (!controllerConfig.has(controller)) controllerConfig.set(controller, []);
    controllerConfig.get(controller).push(input);
    if (input && input.id) {
      form.querySelectorAll(`[name="${controller}"]`).forEach((controllerInput) => {
        const controlsArray = (controllerInput.getAttribute('aria-controls') || '').split(' ').filter((ec) => ec);
        if (!controlsArray.includes(input.id)) controlsArray.push(input.id);
        controllerInput.setAttribute('aria-controls', controlsArray.join(' '));
        input.setAttribute('aria-controlledby', controllerInput.id);
      });
    }
  });
  initConditionals(form, controllerConfig);
  form.addEventListener('change', (e) => { toggleConditional(e, controllerConfig); });
}

function toggleForm(form, disabled = true) {
  [...form.elements].forEach((el) => { el.disabled = disabled; });
}

function generatePayload(form) {
  const payload = {};
  [...form.elements].forEach((field) => {
    if (field.name && !field.disabled) {
      if (field.type === 'radio') {
        if (field.checked) payload[field.name] = field.value;
      } else if (field.type === 'checkbox') {
        if (field.checked) payload[field.name] = payload[field.name] ? `${payload[field.name]},${field.value}` : field.value;
      } else {
        payload[field.name] = field.value;
      }
    }
  });
  return payload;
}

async function handleSubmit(form) {
  try {
    const payload = generatePayload(form);
    toggleForm(form);
    const response = await fetch(form.dataset.action, {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      if (form.dataset.confirmation) window.location.href = form.dataset.confirmation;
    } else {
      throw new Error(await response.text());
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  } finally {
    toggleForm(form, false);
  }
}

function validateOrFocus(form) {
  const valid = form.reportValidity();
  if (!valid) {
    const firstInvalid = form.querySelector(':invalid:not(fieldset)');
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.setAttribute('aria-invalid', true);
    }
  }
  return valid;
}

function enableSubmission(form, submit, fields) {
  form.dataset.action = submit;
  const confirmation = fields.find((f) => f.type === 'confirmation');
  if (confirmation) form.dataset.confirmation = confirmation.label || confirmation.default;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateOrFocus(form)) handleSubmit(form);
  });
  form.addEventListener('input', (e) => {
    if (e.target.hasAttribute('aria-invalid') && e.target.validity.valid) e.target.removeAttribute('aria-invalid');
  });
}

// BNTS Commerce Starter: demo mode when the author gives no submit URL.
function enableDemoSubmission(form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateOrFocus(form)) return;
    form.querySelector('.bnts-form-demo-note')?.remove();
    const note = createElement('p', 'bnts-form-demo-note');
    note.textContent = 'Thanks. This is a demo form, so nothing was sent.';
    form.append(note);
  });
}

function buildField(field) {
  const {
    type, help, field: fieldName, conditional,
  } = field;
  const controlled = conditional || null;
  if (type === 'submit' || type === 'reset') return buildButton(field);
  if (type === 'radio' || type === 'checkbox') {
    const fieldset = buildOptions(field, controlled);
    if (help) fieldset.append(writeHelpText(help, generateId(fieldName)));
    return fieldset;
  }
  if (type === 'toggle') {
    const toggle = buildToggle(field, controlled);
    if (help) toggle.append(writeHelpText(help, generateId(fieldName)));
    return toggle;
  }
  if (type === 'select') {
    const select = buildSelect(field, controlled);
    if (help) select.append(writeHelpText(help, generateId(fieldName)));
    return select;
  }
  const wrapper = createElement('div', `form-field ${type}-field`);
  if (controlled) {
    const controller = controlled.split('-')[0];
    wrapper.dataset.controller = controller;
    wrapper.dataset.condition = controlled;
  }
  const inputId = generateId(fieldName);
  wrapper.append(buildLabel(field.label, 'label', inputId, field.required === 'true'));
  let helpText;
  if (help) {
    helpText = writeHelpText(help, inputId);
    wrapper.append(helpText);
  }
  const input = type === 'textarea' ? buildTextArea(field) : buildInput(field);
  if (type === 'textarea') wrapper.append(input);
  else wrapper.insertBefore(input, wrapper.firstChild.nextSibling);
  if (help) input.setAttribute('aria-describedby', helpText.id);
  return wrapper;
}

function buildForm(fields, submit) {
  const form = createElement('form');
  form.setAttribute('novalidate', '');
  const buttons = [];
  fields.forEach((field) => {
    if (field.type === 'submit' || field.type === 'reset') buttons.push(field);
    else if (field.type !== 'confirmation') form.append(buildField(field));
  });
  if (buttons.length) {
    const buttonWrapper = createElement('div', 'button-wrapper');
    buttons.forEach((button) => buttonWrapper.append(buildField(button)));
    form.append(buttonWrapper);
  }
  enableConditionals(form);
  if (submit) enableSubmission(form, submit, fields);
  else enableDemoSubmission(form);
  return form;
}

export default function decorate(block) {
  block.style.visibility = 'hidden';
  const [source, submit] = [...block.querySelectorAll('a[href]')].map((a) => a.href);
  if (source) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          try {
            const resp = await fetch(new URL(source, window.location.origin));
            if (!resp.ok) throw new Error(`${resp.status}: ${resp.statusText}`);
            const { data } = await resp.json();
            if (!data) throw new Error(`No form fields at ${source}`);
            const form = buildForm(data, submit);
            block.replaceChildren(form);
            block.removeAttribute('style');
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Could not build form from', source, error);
            block.parentElement.remove();
          }
          observer.disconnect();
        }
      });
    }, { threshold: 0 });
    observer.observe(block);
  } else {
    // eslint-disable-next-line no-console
    console.error('Unable to create form without source');
    block.parentElement.remove();
  }
}
