import { escapeHtml } from './utils.js';

// AG Grid Community has no Set Filter (that's an Enterprise module), so this is a
// small hand-rolled checkbox filter implementing the plain IFilterComp contract:
// https://www.ag-grid.com/javascript-data-grid/component-filter/
export function createCheckboxSetFilter({ values, labelFor = (value) => value } = {}) {
  return class CheckboxSetFilter {
    init(params) {
      this.params = params;
      this.selected = new Set();
      this.options = typeof values === 'function' ? values() : values || [];
      this.eGui = document.createElement('div');
      this.eGui.className = 'set-filter-lite';
      this.render();
    }

    render() {
      this.eGui.innerHTML = `
        <div class="set-filter-list">${this.options.map((value) => `
          <label><input type="checkbox" value="${escapeHtml(value)}" ${this.selected.has(value) ? 'checked' : ''}> ${escapeHtml(labelFor(value))}</label>
        `).join('')}</div>
        <div class="set-filter-actions">
          <button type="button" data-action="all">Select all</button>
          <button type="button" data-action="clear">Clear</button>
        </div>`;
      this.eGui.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) this.selected.add(checkbox.value); else this.selected.delete(checkbox.value);
          this.params.filterChangedCallback();
        });
      });
      this.eGui.querySelector('[data-action="all"]').addEventListener('click', () => {
        this.selected = new Set(this.options);
        this.render();
        this.params.filterChangedCallback();
      });
      this.eGui.querySelector('[data-action="clear"]').addEventListener('click', () => {
        this.selected.clear();
        this.render();
        this.params.filterChangedCallback();
      });
    }

    getGui() { return this.eGui; }
    isFilterActive() { return this.selected.size > 0; }
    doesFilterPass(params) { return this.selected.has(String(params.data[this.params.colDef.field])); }
    getModel() { return this.isFilterActive() ? { values: [...this.selected] } : null; }
    setModel(model) { this.selected = new Set(model ? model.values : []); this.render(); }
    getModelAsString() { return this.isFilterActive() ? `${this.selected.size} selected` : ''; }
  };
}
