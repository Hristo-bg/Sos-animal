/**
 * SOS Animal — Admin Command Center
 * Smooth pointer-based drag, search, stats, quick actions
 */
(function initAdminPanelModule(global) {
  const STATUS_LABELS = {
    wounded: 'Ранено',
    deceased: 'Умряло',
    investigating: 'Разследва се',
    treated: 'Лекувано',
    released: 'Освободено',
    verified: 'Потвърдено',
    archived: 'Архивирано',
    handled: 'Изчистено',
  };

  const STATUS_COLORS = {
    wounded: '#FBBF24',
    deceased: '#EF4444',
    investigating: '#F97316',
    treated: '#38BDF8',
    released: '#34D399',
    verified: '#A78BFA',
    archived: '#94A3B8',
    handled: '#10B981',
  };

  const API_HOST = '';

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  class AdminPanelController {
    constructor(config) {
      this.config = config;
      this.panel = document.getElementById('adminPanel');
      if (!this.panel) return;

      this.incidents = [];
      this.filtered = [];
      this.selectedId = null;
      this.activeTab = 'list';
      this.statusFilter = '';
      this.sortBy = 'newest';
      this.searchQuery = '';
      this.autoRefreshTimer = null;
      this.posInitialized = false;

      this.cacheDom();
      this.setupDrag();
      this.bindEvents();
      this.restorePosition();
    }

    cacheDom() {
      const p = this.panel;
      this.els = {
        handle: p.querySelector('.admin-drag-handle'),
        statTotal: p.querySelector('#adminStatTotal'),
        statActive: p.querySelector('#adminStatActive'),
        statResolved: p.querySelector('#adminStatResolved'),
        statToday: p.querySelector('#adminStatToday'),
        search: p.querySelector('#adminSearch'),
        sort: p.querySelector('#adminSort'),
        chips: p.querySelectorAll('.adminChip'),
        tabs: p.querySelectorAll('.adminTab'),
        views: {
          list: p.querySelector('#adminViewList'),
          detail: p.querySelector('#adminViewDetail'),
          stats: p.querySelector('#adminViewStats'),
        },
        list: p.querySelector('#adminIncidentsList'),
        detail: p.querySelector('#adminDetailContent'),
        statsBreakdown: p.querySelector('#adminStatsBreakdown'),
        statusSelect: p.querySelector('#adminStatusSelect'),
        notes: p.querySelector('#adminNotesInput'),
        footerTime: p.querySelector('#adminLastSync'),
        autoRefresh: p.querySelector('#adminAutoRefresh'),
      };
    }

    /* ——— Smooth drag (pointer events + capture) ——— */
    setupDrag() {
      const panel = this.panel;
      const handle = this.els.handle;
      if (!handle) return;

      let dragging = false;
      let startX = 0;
      let startY = 0;
      let originLeft = 0;
      let originTop = 0;

      const onPointerDown = (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('button, select, input, a, .no-drag')) return;

        const rect = panel.getBoundingClientRect();
        originLeft = rect.left;
        originTop = rect.top;
        startX = e.clientX;
        startY = e.clientY;
        dragging = true;

        panel.style.transform = 'none';
        panel.style.left = `${originLeft}px`;
        panel.style.top = `${originTop}px`;
        panel.classList.add('dragging');
        panel.style.transition = 'none';

        handle.setPointerCapture(e.pointerId);
        e.preventDefault();
      };

      const onPointerMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let left = originLeft + dx;
        let top = originTop + dy;

        const pad = 8;
        const maxL = window.innerWidth - panel.offsetWidth - pad;
        const maxT = window.innerHeight - panel.offsetHeight - pad;
        left = Math.max(pad, Math.min(left, maxL));
        top = Math.max(pad, Math.min(top, maxT));

        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
      };

      const onPointerUp = (e) => {
        if (!dragging) return;
        dragging = false;
        panel.classList.remove('dragging');
        panel.style.transition = '';
        try {
          handle.releasePointerCapture(e.pointerId);
        } catch (_) {}
        this.savePosition();
      };

      handle.addEventListener('pointerdown', onPointerDown);
      handle.addEventListener('pointermove', onPointerMove);
      handle.addEventListener('pointerup', onPointerUp);
      handle.addEventListener('pointercancel', onPointerUp);
    }

    savePosition() {
      const rect = this.panel.getBoundingClientRect();
      localStorage.setItem('sos_admin_panel_pos', JSON.stringify({
        left: rect.left,
        top: rect.top,
      }));
    }

    restorePosition() {
      try {
        const raw = localStorage.getItem('sos_admin_panel_pos');
        if (!raw) return;
        const { left, top } = JSON.parse(raw);
        if (typeof left === 'number' && typeof top === 'number') {
          this.panel.style.left = `${left}px`;
          this.panel.style.top = `${top}px`;
          this.panel.style.transform = 'none';
          this.posInitialized = true;
        }
      } catch (_) {}
    }

    centerPanel() {
      const w = this.panel.offsetWidth || 480;
      const h = this.panel.offsetHeight || 400;
      const left = Math.max(16, (window.innerWidth - w) / 2);
      const top = Math.max(72, (window.innerHeight - h) / 2);
      this.panel.style.left = `${left}px`;
      this.panel.style.top = `${top}px`;
      this.panel.style.transform = 'none';
    }

    bindEvents() {
      const { config } = this;

      document.getElementById('btnAdminPanel')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.open();
      });

      this.panel.querySelector('.adminWinBtn.close')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });

      this.panel.querySelector('.adminWinBtn.minimize')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.panel.classList.toggle('minimized');
      });

      this.panel.querySelector('.adminWinBtn.maximize')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.panel.classList.remove('minimized');
        if (!this.posInitialized) this.centerPanel();
      });

      document.getElementById('btnRefreshAdmin')?.addEventListener('click', () => this.loadIncidents());
      this.els.search?.addEventListener('input', () => {
        this.searchQuery = this.els.search.value.trim().toLowerCase();
        this.applyFilters();
      });
      this.els.sort?.addEventListener('change', () => {
        this.sortBy = this.els.sort.value;
        this.applyFilters();
      });

      this.els.chips?.forEach((chip) => {
        chip.addEventListener('click', () => {
          this.els.chips.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          this.statusFilter = chip.dataset.status || '';
          this.loadIncidents();
        });
      });

      this.els.tabs?.forEach((tab) => {
        tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
      });

      document.getElementById('btnAdminBack')?.addEventListener('click', () => this.switchTab('list'));
      document.getElementById('btnAdminExport')?.addEventListener('click', () => this.exportCsv());
      document.getElementById('btnAdminUpdateStatus')?.addEventListener('click', () => this.updateStatus());
      document.getElementById('btnAdminSaveNotes')?.addEventListener('click', () => this.saveNotes());
      document.getElementById('btnAdminDelete')?.addEventListener('click', () => this.deleteIncident());
      document.getElementById('btnAdminCopyCoords')?.addEventListener('click', () => this.copyCoords());
      document.getElementById('btnAdminOpenMaps')?.addEventListener('click', () => this.openMaps());

      this.els.autoRefresh?.addEventListener('change', () => this.toggleAutoRefresh());

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.panel.classList.contains('visible')) {
          if (this.activeTab === 'detail') this.switchTab('list');
          else this.close();
        }
      });
    }

    open() {
      if (!this.posInitialized) {
        this.centerPanel();
        this.posInitialized = true;
      }
      this.panel.classList.add('visible');
      this.panel.classList.remove('minimized');
      this.loadIncidents();
      if (this.els.autoRefresh?.checked) this.toggleAutoRefresh();
      setTimeout(() => this.getMap()?.invalidateSize?.({ animate: false }), 350);
    }

    close() {
      this.panel.classList.remove('visible');
      this.selectedId = null;
      this.stopAutoRefresh();
    }

    switchTab(tab) {
      if (tab === 'detail' && !this.selectedId) {
        this.config.showToast?.('Изберете инцидент от списъка', true);
        tab = 'list';
      }
      this.activeTab = tab;
      this.els.tabs?.forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
      Object.entries(this.els.views).forEach(([key, el]) => {
        if (el) el.classList.toggle('active', key === tab);
      });
      if (tab === 'stats') this.renderStatsView();
      if (tab === 'detail' && this.selectedId) this.loadDetail(this.selectedId);
    }

    toggleAutoRefresh() {
      this.stopAutoRefresh();
      if (this.els.autoRefresh?.checked) {
        this.autoRefreshTimer = setInterval(() => this.loadIncidents(true), 30000);
      }
    }

    stopAutoRefresh() {
      if (this.autoRefreshTimer) {
        clearInterval(this.autoRefreshTimer);
        this.autoRefreshTimer = null;
      }
    }

    async loadIncidents(silent = false) {
      const { API_BASE, token, showToast } = this.config;
      if (!silent) {
        this.els.list.innerHTML = '<div class="adminLoading"><i class="fas fa-spinner fa-spin"></i> Зареждане...</div>';
      }

      try {
        const q = this.statusFilter ? `?status=${this.statusFilter}` : '';
        const res = await fetch(`${API_BASE}/incidents${q}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('load_failed');
        this.incidents = await res.json();
        this.updateStats();
        this.applyFilters();
        if (this.els.footerTime) {
          this.els.footerTime.textContent = `Обновено: ${new Date().toLocaleTimeString('bg-BG')}`;
        }
        if (this.activeTab === 'stats') this.renderStatsView();
      } catch (err) {
        console.error(err);
        this.els.list.innerHTML = '<div class="adminEmpty"><i class="fas fa-database"></i>Грешка при зареждане</div>';
        showToast('Грешка при зареждане на инциденти', true);
      }
    }

    updateStats() {
      const today = new Date().toDateString();
      const active = this.incidents.filter((i) => !i.resolved_at && i.status !== 'archived').length;
      const resolved = this.incidents.filter((i) => i.resolved_at).length;
      const todayCount = this.incidents.filter(
        (i) => new Date(i.created_at).toDateString() === today
      ).length;

      if (this.els.statTotal) this.els.statTotal.textContent = this.incidents.length;
      if (this.els.statActive) this.els.statActive.textContent = active;
      if (this.els.statResolved) this.els.statResolved.textContent = resolved;
      if (this.els.statToday) this.els.statToday.textContent = todayCount;
    }

    applyFilters() {
      let list = [...this.incidents];

      if (this.searchQuery) {
        const q = this.searchQuery;
        list = list.filter((i) => {
          const hay = [
            i.id,
            i.species,
            i.reporter_email,
            i.status,
            STATUS_LABELS[i.status],
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        });
      }

      list.sort((a, b) => {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        if (this.sortBy === 'oldest') return da - db;
        if (this.sortBy === 'species') {
          return (a.species || '').localeCompare(b.species || '', 'bg');
        }
        return db - da;
      });

      this.filtered = list;
      this.renderList();
    }

    renderList() {
      const { user } = this.config;
      if (!this.filtered.length) {
        this.els.list.innerHTML = '<div class="adminEmpty"><i class="fas fa-inbox"></i>Няма инциденти по този филтър</div>';
        return;
      }

      this.els.list.innerHTML = this.filtered
        .map((inc) => {
          const label = STATUS_LABELS[inc.status] || inc.status;
          const color = STATUS_COLORS[inc.status] || '#94A3B8';
          const reporter =
            inc.reporter_email === user.email
              ? `${escapeHtml(inc.reporter_email)} (Вие)`
              : escapeHtml(inc.reporter_email || 'Анонимен');
          const selected = inc.id === this.selectedId ? ' selected' : '';

          return `
          <article class="adminIncidentCard${selected}" data-id="${inc.id}">
            <div class="adminCardTop">
              <span class="adminCardTitle">#${inc.id} · ${escapeHtml(inc.species || 'Непознато')}</span>
              <span class="adminBadge" style="background:${color}">${escapeHtml(label)}</span>
            </div>
            <div class="adminCardMeta">
              <span><i class="fas fa-calendar"></i>${new Date(inc.created_at).toLocaleDateString('bg-BG')}</span>
              <span><i class="fas fa-user"></i>${reporter}</span>
              ${inc.resolved_at ? `<span><i class="fas fa-check"></i>${new Date(inc.resolved_at).toLocaleDateString('bg-BG')}</span>` : ''}
            </div>
            <div class="adminCardActions no-drag">
              <button type="button" class="adminCardBtn primary" data-action="detail" data-id="${inc.id}">
                <i class="fas fa-eye"></i> Детайли
              </button>
              <button type="button" class="adminCardBtn" data-action="map" data-id="${inc.id}">
                <i class="fas fa-map-marker-alt"></i> Карта
              </button>
              <select class="adminQuickStatus no-drag" data-action="quick-status" data-id="${inc.id}" title="Бърз статус">
                ${Object.entries(STATUS_LABELS)
                  .map(
                    ([val, lbl]) =>
                      `<option value="${val}" ${inc.status === val ? 'selected' : ''}>${lbl}</option>`
                  )
                  .join('')}
              </select>
            </div>
          </article>`;
        })
        .join('');

      this.els.list.querySelectorAll('[data-action="detail"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectIncident(Number(btn.dataset.id));
        });
      });

      this.els.list.querySelectorAll('[data-action="map"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.focusOnMap(Number(btn.dataset.id));
        });
      });

      this.els.list.querySelectorAll('[data-action="quick-status"]').forEach((sel) => {
        sel.addEventListener('change', (e) => {
          e.stopPropagation();
          this.patchIncident(Number(sel.dataset.id), { status: sel.value }, 'Статусът е обновен');
        });
      });

      this.els.list.querySelectorAll('.adminIncidentCard').forEach((card) => {
        card.addEventListener('click', () => {
          this.selectIncident(Number(card.dataset.id));
        });
      });
    }

    selectIncident(id) {
      this.selectedId = id;
      this.renderList();
      this.switchTab('detail');
      this.loadDetail(id);
      this.focusOnMap(id);
    }

    async loadDetail(id) {
      const { API_BASE, token, showToast } = this.config;
      this.els.detail.innerHTML = '<div class="adminLoading"><i class="fas fa-spinner fa-spin"></i> Зареждане...</div>';

      try {
        const res = await fetch(`${API_BASE}/incidents/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('not_found');
        const inc = await res.json();
        this.renderDetail(inc);
      } catch (err) {
        this.els.detail.innerHTML = '<div class="adminEmpty"><i class="fas fa-exclamation-triangle"></i>Няма данни за този инцидент</div>';
        showToast('Грешка при зареждане на детайли', true);
      }
    }

    renderDetail(inc) {
      const { user } = this.config;
      const label = STATUS_LABELS[inc.status] || inc.status;
      const reporter =
        inc.reporter_email === user.email
          ? `${escapeHtml(inc.reporter_email)} (Вие)`
          : escapeHtml(inc.reporter_email || 'Анонимен');

      this.els.detail.innerHTML = `
        <div class="adminDetailHero">
          <h4>#${inc.id} — ${escapeHtml(inc.species || 'Непознато')}</h4>
          <span class="adminBadge" style="background:${STATUS_COLORS[inc.status] || '#94A3B8'};font-size:0.8rem">${escapeHtml(label)}</span>
        </div>
        <div class="adminDetailGrid">
          <div class="adminDetailRow"><strong>Координати</strong><span id="adminCoordText">${inc.lat?.toFixed(6)}, ${inc.lng?.toFixed(6)}</span></div>
          <div class="adminDetailRow"><strong>Докладвал</strong><span>${reporter}</span></div>
          <div class="adminDetailRow"><strong>Създаден</strong><span>${new Date(inc.created_at).toLocaleString('bg-BG')}</span></div>
          ${inc.resolved_at ? `<div class="adminDetailRow"><strong>Разрешен</strong><span>${new Date(inc.resolved_at).toLocaleString('bg-BG')}</span></div>` : ''}
          ${inc.resolver_email ? `<div class="adminDetailRow"><strong>Обработил</strong><span>${escapeHtml(inc.resolver_email)}</span></div>` : ''}
          ${inc.admin_notes ? `<div class="adminDetailRow"><strong>Бележки</strong><div class="adminNotesBox">${escapeHtml(inc.admin_notes)}</div></div>` : ''}
          ${inc.photo_url ? `<div class="adminDetailRow"><strong>Снимка</strong><img class="adminPhoto" src="${API_HOST}${escapeHtml(inc.photo_url)}" alt="Снимка"></div>` : ''}
        </div>
        <div style="margin-top:0.75rem">
          <label class="adminFieldLabel">Смени статус</label>
          <select id="adminStatusSelect" class="adminSelect">${this.statusOptions(inc.status)}</select>
          <label class="adminFieldLabel">Админ бележки</label>
          <textarea id="adminNotesInput" class="adminTextarea" placeholder="Вътрешни бележки за екипа...">${escapeHtml(inc.admin_notes || '')}</textarea>
        </div>`;

      this.els.statusSelect = document.getElementById('adminStatusSelect');
      this.els.notes = document.getElementById('adminNotesInput');
      this.currentIncident = inc;
    }

    statusOptions(selected) {
      return Object.entries(STATUS_LABELS)
        .map(([val, lbl]) => `<option value="${val}" ${val === selected ? 'selected' : ''}>${lbl}</option>`)
        .join('');
    }

    renderStatsView() {
      const counts = {};
      this.incidents.forEach((i) => {
        counts[i.status] = (counts[i.status] || 0) + 1;
      });

      const rows = Object.entries(STATUS_LABELS)
        .map(([key, lbl]) => {
          const n = counts[key] || 0;
          if (!n) return '';
          const pct = this.incidents.length ? Math.round((n / this.incidents.length) * 100) : 0;
          return `
            <div class="adminDetailRow">
              <strong>${escapeHtml(lbl)}</strong>
              <span>${n} <span style="color:#64748B">(${pct}%)</span></span>
            </div>`;
        })
        .join('');

      this.els.statsBreakdown.innerHTML = `
        <div class="adminDetailHero">
          <h4>Разпределение по статус</h4>
          <p style="margin:0;font-weight:600;color:#334155">Общо ${this.incidents.length} записа в базата</p>
        </div>
        <div class="adminDetailGrid">${rows || '<div class="adminEmpty">Няма данни</div>'}</div>`;
    }

    getMap() {
      return this.config.getMap?.() || this.config.map;
    }

    focusOnMap(id) {
      const inc = this.incidents.find((i) => i.id === id);
      const map = this.getMap();
      const lat = Number(inc?.lat);
      const lng = Number(inc?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !map) {
        this.config.showToast?.('Картата не е готова или няма координати', true);
        return;
      }
      map.flyTo([lat, lng], 14, { duration: 0.8 });
      this.config.onFocusIncident?.(inc);
      this.config.showToast?.(`Фокус: #${id} на картата`, false);
    }

    async patchIncident(id, body, successMsg) {
      const { API_BASE, token, showToast } = this.config;
      try {
        const res = await fetch(`${API_BASE}/incidents/${id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || 'patch_failed');
        }
        showToast(successMsg, false);
        await this.loadIncidents(true);
        if (this.selectedId === id) this.loadDetail(id);
        this.config.onDataChanged?.();
      } catch (err) {
        console.error('patchIncident:', err);
        showToast(err.message === 'patch_failed' ? 'Операцията не успя' : (err.message || 'Операцията не успя'), true);
      }
    }

    updateStatus() {
      if (!this.selectedId) return;
      const sel = document.getElementById('adminStatusSelect');
      if (!sel) return;
      this.patchIncident(this.selectedId, { status: sel.value }, 'Статусът е обновен');
    }

    saveNotes() {
      if (!this.selectedId) return;
      const notesEl = document.getElementById('adminNotesInput');
      if (!notesEl) return;
      this.patchIncident(this.selectedId, { admin_notes: notesEl.value.trim() }, 'Бележките са запазени');
    }

    async deleteIncident() {
      if (!this.selectedId) return;
      if (!confirm('Сигурни ли сте, че искате да изтриете този инцидент?')) return;

      const { API_BASE, token, showToast } = this.config;
      try {
        const res = await fetch(`${API_BASE}/incidents/${this.selectedId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('delete_failed');
        showToast('Инцидентът е изтрит', false);
        this.selectedId = null;
        this.switchTab('list');
        await this.loadIncidents(true);
        this.config.onDataChanged?.();
      } catch (err) {
        showToast('Грешка при изтриване', true);
      }
    }

    copyCoords() {
      const inc = this.currentIncident;
      if (!inc?.lat) return;
      const text = `${inc.lat}, ${inc.lng}`;
      navigator.clipboard?.writeText(text).then(() => {
        this.config.showToast('Координатите са копирани', false);
      });
    }

    openMaps() {
      const inc = this.currentIncident;
      if (!inc?.lat) return;
      window.open(`https://www.google.com/maps?q=${inc.lat},${inc.lng}`, '_blank');
    }

    exportCsv() {
      if (!this.filtered.length) {
        this.config.showToast('Няма данни за експорт', true);
        return;
      }
      const headers = ['id', 'species', 'status', 'lat', 'lng', 'reporter', 'created_at', 'resolved_at'];
      const rows = this.filtered.map((i) =>
        headers.map((h) => `"${String(i[h] ?? i.reporter_email ?? '').replace(/"/g, '""')}"`).join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sos-animal-incidents-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      this.config.showToast('CSV файлът е изтеглен', false);
    }
  }

  global.initAdminPanel = function initAdminPanel(config) {
    if (config.user?.role !== 'admin') return null;
    return new AdminPanelController(config);
  };
})(window);
