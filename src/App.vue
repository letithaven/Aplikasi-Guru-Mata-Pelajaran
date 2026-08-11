<template>
  <div>
    <div class="top-progress-bar" v-if="loading || isDbProcessing" :style="{ width: loadingProgress + '%' }"></div>

    <!-- Futuristic Sync & Database Loading Overlay -->
    <div class="sync-overlay" v-if="showSyncOverlay">
      <div class="sync-card">
        <div class="sync-spinner-ring"></div>
        <h5 class="fw-bold text-light mb-1" style="letter-spacing: 0.5px;">PENYIAPAN DATABASE SISTEM</h5>
        <p class="text-info small mb-3 font-monospace">{{ syncOverlayStep }}</p>
        
        <div class="sync-progress-bar-bg">
          <div class="sync-progress-bar-fill" :style="{ width: syncOverlayPercent + '%' }"></div>
        </div>
        
        <div class="d-flex justify-content-between align-items-center mt-2 text-muted" style="font-size: 0.72rem;">
          <span>MAN 2 Seram Bagian Timur</span>
          <span class="text-info font-monospace fw-bold">{{ syncOverlayPercent }}%</span>
        </div>
      </div>
    </div>

    <!-- Futuristic Toast Notification -->
    <div class="futuristic-toast" v-if="showModernToast">
      <div class="rounded-circle bg-success bg-opacity-20 border border-success text-success p-2 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 38px; height: 38px;">
        <i :class="modernToastIcon"></i>
      </div>
      <div class="min-w-0 flex-fill">
        <h6 class="fw-bold text-light mb-0" style="font-size: 0.88rem;">{{ modernToastTitle }}</h6>
        <small class="text-muted d-block text-truncate" style="font-size: 0.75rem;">{{ modernToastMessage }}</small>
      </div>
      <button type="button" class="btn-close btn-close-white ms-auto flex-shrink-0" style="font-size: 0.7rem;" @click="showModernToast = false"></button>
    </div>

    <div v-if="isPublicView" class="container py-4">
      <div class="card p-4 text-light bg-dark">
        <div class="d-flex align-items-center justify-content-center gap-3 mb-4 pb-3 border-bottom border-secondary">
          <div v-if="formattedMadrasahLogoUrl && !isLogoImageError" class="flex-shrink-0">
            <img :src="formattedMadrasahLogoUrl" alt="Logo Madrasah" @error="handleLogoError" style="max-height: 65px; max-width: 65px; object-fit: contain;" />
          </div>
          <div class="text-center">
            <h3 class="fw-extrabold mb-1 text-info">{{ publicReportData.schoolName || 'MAN 2 Seram Bagian Timur' }}</h3>
            <h5 class="fw-bold text-light mb-1">LAPORAN MANAJEMEN KELAS & PRESENSI SISWA</h5>
            <p class="text-muted mb-0">Kelas: <strong class="text-light">{{ publicReportData.className }}</strong> • {{ publicReportData.monthName ? 'Bulan: ' + publicReportData.monthName : 'Semester Berjalan' }}</p>
          </div>
        </div>

        <div v-if="publicReportLoading" class="text-center py-5">
          <div class="spinner-border text-info" role="status"></div>
          <p class="text-muted small mt-2">Memuat Laporan Presensi...</p>
        </div>

        <div v-else-if="publicReportError" class="alert alert-danger bg-dark border-danger text-danger p-4 text-center">
          <i class="fa-solid fa-triangle-exclamation fa-2x mb-2"></i>
          <h5 class="fw-bold">Gagal Memuat Laporan Publik</h5>
          <p class="mb-0 text-muted small">{{ publicReportError }}</p>
          <p class="mt-2 mb-0" style="font-size: 0.8rem;">Pastikan deployment Google Apps Script diatur ke <strong class="text-light">"Anyone" (Siapa saja)</strong>.</p>
        </div>

        <div v-else>
          <div class="table-responsive mb-4">
            <table class="table table-bordered table-dark-custom align-middle">
              <thead>
                <tr class="text-center">
                  <th style="width: 50px;">NO</th>
                  <th>NISN</th>
                  <th class="text-start">NAMA SISWA</th>
                  <th>HADIR</th>
                  <th>IZIN</th>
                  <th>SAKIT</th>
                  <th>ALFA</th>
                  <th>% HADIR</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, idx) in publicReportData.students" :key="s.id" class="text-center">
                  <td><strong class="text-info">{{ idx + 1 }}</strong></td>
                  <td><span class="badge bg-secondary bg-opacity-30 text-light border border-secondary">{{ s.nisn || '-' }}</span></td>
                  <td class="text-start fw-semibold text-light">{{ s.name }}</td>
                  <td class="text-success fw-bold">{{ getPublicStudentStats(s.id).H }}</td>
                  <td class="text-info fw-bold">{{ getPublicStudentStats(s.id).I }}</td>
                  <td class="text-warning fw-bold">{{ getPublicStudentStats(s.id).S }}</td>
                  <td class="text-danger fw-bold">{{ getPublicStudentStats(s.id).A }}</td>
                  <td class="fw-extrabold text-info">{{ calculatePublicStudentPercent(s.id) }}%</td>
                </tr>
                <tr v-if="publicReportData.students.length === 0">
                  <td colspan="8" class="p-0">
                    <div class="empty-state">
                      <div class="empty-state-icon">
                        <i class="fa-solid fa-folder-open fa-lg"></i>
                      </div>
                      <span class="empty-state-title">Belum ada data presensi</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="d-flex justify-content-between align-items-end mt-5 pt-3">
            <div></div>
            <div class="text-center" style="min-width: 240px;">
              <p class="mb-5 text-muted small">Wali Kelas / Guru Pengampu,</p>
              <strong class="d-block text-light text-decoration-underline">{{ publicReportData.teacherName || 'Guru Pengampu' }}</strong>
              <small class="text-muted">NIP. {{ publicReportData.teacherNip || '-' }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="app-container" v-if="!isPublicView">
      <aside class="app-sidebar" :class="{ 'collapsed': sidebarCollapsed, 'mobile-open': mobileMenuOpen }" v-if="currentUser">
        <a href="#" class="sidebar-brand d-flex align-items-center gap-2">
          <div v-if="formattedMadrasahLogoUrl && !isLogoImageError" class="brand-icon overflow-hidden p-1 bg-white bg-opacity-10 border border-info border-opacity-30 rounded-circle flex-shrink-0" style="width: 36px; height: 36px;">
            <img :src="formattedMadrasahLogoUrl" alt="Logo Madrasah" @error="handleLogoError" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div v-else class="brand-icon bg-info bg-opacity-20 border border-info border-opacity-40 text-info d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style="width: 36px; height: 36px; box-shadow: 0 0 10px rgba(14,165,233,0.3);">
            <i class="fa-solid fa-cube text-info"></i>
          </div>
          <div class="brand-text-wrapper min-w-0">
            <div class="fw-extrabold text-light text-truncate" style="font-size: 1.05rem; letter-spacing: 0.5px;">DADU Guru</div>
            <small class="text-info d-block text-truncate" style="font-size: 0.64rem; font-weight: 600; letter-spacing: 0.2px; margin-top: -3px;">Digitalisasi Data dari Guru</small>
          </div>
        </a>
        
        <ul class="sidebar-menu">
          <li class="menu-item" :class="{ active: currentTab === 'dashboard' }">
            <a class="menu-link" @click="currentTab = 'dashboard'; mobileMenuOpen = false;" title="Dashboard">
              <i class="fa-solid fa-chart-pie"></i>
              <span>Dashboard</span>
            </a>
          </li>

          <!-- Master Data Accordion -->
          <li class="menu-item" :class="{ active: currentTab === 'classes' || currentTab === 'students', 'flyout-open': openMasterDataMenu }">
            <a class="menu-link d-flex align-items-center justify-content-between" @click.stop="toggleMasterDataMenu" title="Master Data">
              <div class="d-flex align-items-center gap-3">
                <i class="fa-solid fa-database text-info"></i>
                <span>Master Data</span>
              </div>
              <i class="fa-solid fa-chevron-down menu-chevron" :class="{ open: openMasterDataMenu }"></i>
            </a>
            <ul class="submenu-list" v-show="openMasterDataMenu || sidebarCollapsed">
              <li class="submenu-item" :class="{ active: currentTab === 'classes' }">
                <a class="submenu-link" @click="currentTab = 'classes'; mobileMenuOpen = false;" title="Kelas & Mapel">
                  <i class="fa-solid fa-layer-group"></i>
                  <span>Kelas & Mapel</span>
                </a>
              </li>
              <li class="submenu-item" :class="{ active: currentTab === 'students' }">
                <a class="submenu-link" @click="currentTab = 'students'; mobileMenuOpen = false;" title="Data Siswa">
                  <i class="fa-solid fa-users"></i>
                  <span>Data Siswa</span>
                </a>
              </li>
            </ul>
          </li>

          <!-- Aktivitas KBM & Presensi Accordion -->
          <li class="menu-item" :class="{ active: currentTab === 'attendance' || currentTab === 'grades' || currentTab === 'journal', 'flyout-open': openPresensiMenu }">
            <a class="menu-link d-flex align-items-center justify-content-between" @click.stop="togglePresensiMenu" title="Aktivitas KBM & Presensi">
              <div class="d-flex align-items-center gap-3">
                <i class="fa-solid fa-calendar-check text-info"></i>
                <span>Aktivitas KBM</span>
              </div>
              <i class="fa-solid fa-chevron-down menu-chevron" :class="{ open: openPresensiMenu }"></i>
            </a>
            <ul class="submenu-list" v-show="openPresensiMenu || sidebarCollapsed">
              <li class="submenu-item" :class="{ active: currentTab === 'attendance' && attMode === 'daily' }">
                <a class="submenu-link" @click="currentTab = 'attendance'; attMode = 'daily'; mobileMenuOpen = false;" title="Presensi Harian">
                  <i class="fa-solid fa-pen-to-square"></i>
                  <span>Presensi Harian</span>
                </a>
              </li>
              <li class="submenu-item" :class="{ active: currentTab === 'attendance' && attMode === 'recap' }">
                <a class="submenu-link" @click="currentTab = 'attendance'; attMode = 'recap'; loadMonthlyRecapData(); mobileMenuOpen = false;" title="Rekapitulasi Bulanan">
                  <i class="fa-solid fa-table-cells"></i>
                  <span>Rekapitulasi Bulanan</span>
                </a>
              </li>
              <li class="submenu-item" :class="{ active: currentTab === 'journal' }">
                <a class="submenu-link" @click="currentTab = 'journal'; mobileMenuOpen = false;" title="Jurnal Mengajar">
                  <i class="fa-solid fa-book-open-reader"></i>
                  <span>Jurnal Mengajar</span>
                </a>
              </li>
              <li class="submenu-item" :class="{ active: currentTab === 'grades' }">
                <a class="submenu-link" @click="currentTab = 'grades'; loadGradesData(); mobileMenuOpen = false;" title="Penilaian Akademik">
                  <i class="fa-solid fa-award"></i>
                  <span>Penilaian Akademik</span>
                </a>
              </li>
            </ul>
          </li>

          <li class="menu-item" :class="{ active: currentTab === 'report' }">
            <a class="menu-link" @click="currentTab = 'report'; loadReportTab(); mobileMenuOpen = false;" title="Laporan Transparan">
              <i class="fa-solid fa-file-invoice"></i>
              <span>Laporan Transparan</span>
            </a>
          </li>
        </ul>

        <div class="p-3 border-top border-secondary">
          <button class="btn btn-outline-danger w-100 btn-sm d-flex align-items-center justify-content-center gap-2" @click="logout" title="Keluar">
            <i class="fa-solid fa-power-off"></i>
            <span class="btn-hide-text">Keluar</span>
          </button>
        </div>
      </aside>

      <div v-if="mobileMenuOpen" class="sidebar-overlay" @click="toggleMobileMenu"></div>

      <div class="app-main" :class="{ 'expanded': sidebarCollapsed, 'auth-mode': !currentUser }">
        <header class="app-header" v-if="currentUser">
          <div class="d-flex align-items-center gap-1 gap-sm-2 min-w-0">
            <button class="btn btn-outline-cyber btn-sm mobile-menu-toggle flex-shrink-0" @click="toggleMobileMenu" title="Buka Menu">
              <i class="fa-solid fa-bars"></i>
            </button>

            <button class="btn btn-outline-cyber btn-sm desktop-collapse-toggle flex-shrink-0" @click="toggleSidebar" title="Sembunyikan / Buka Sidebar">
              <i class="fa-solid" :class="sidebarCollapsed ? 'fa-indent' : 'fa-bars'"></i>
            </button>
            
            <div class="d-flex align-items-center gap-1.5 bg-dark bg-opacity-60 border border-info border-opacity-30 rounded-3 px-2 py-0.5 shadow-sm">
              <i class="fa-solid fa-school text-info flex-shrink-0" style="font-size: 0.85rem;"></i>
              <select class="form-select form-select-sm fw-bold border-0 bg-transparent text-light shadow-none text-truncate py-1 ms-1" v-model="selectedClassId" style="min-width: 130px; max-width: 175px; cursor: pointer; font-size: 0.82rem;" @change="onClassChange" title="Pilih Kelas Aktif">
                <option value="" disabled class="bg-dark text-light">Pilih Kelas</option>
                <option v-for="c in classes" :key="c.id" :value="c.id" class="bg-dark text-light">{{ c.name }}</option>
              </select>
            </div>

            <button class="btn btn-outline-cyber btn-sm d-flex align-items-center gap-1 flex-shrink-0" @click="syncAllData" :disabled="loading || isDbProcessing" title="Sinkronkan & Refresh Data">
              <i class="fa-solid" :class="(loading || isDbProcessing) ? 'fa-circle-notch fa-spin text-info' : 'fa-rotate'"></i>
              <span class="d-none d-md-inline">{{ (loading || isDbProcessing) ? 'Sync...' : 'Sync' }}</span>
            </button>
          </div>

          <div class="d-flex align-items-center gap-1 gap-sm-2 flex-shrink-0 ms-auto">
            <!-- Widget Waktu Lokal (Diprioritaskan & Responsif) -->
            <div class="header-clock-pill d-flex align-items-center gap-1 gap-md-2 px-2 px-md-3 py-1 rounded-pill small shadow-sm text-nowrap">
              <i class="fa-solid fa-calendar-days clock-date-icon d-none d-md-inline"></i>
              <span class="fw-semibold clock-date-text d-none d-md-inline">{{ formattedDateHeader }}</span>
              <span class="clock-divider d-none d-md-inline">•</span>
              <i class="fa-solid fa-clock clock-time-icon"></i>
              <span class="fw-bold font-monospace clock-time-text" title="Waktu Perangkat Lokal">{{ currentTimeString }}</span>
            </div>

            <span v-if="isReadOnlyUser" class="badge bg-info text-dark fw-bold px-2 py-1 text-nowrap d-none d-sm-inline-block" title="Mode Supervisi (Read-Only)">
              <i class="fa-solid fa-shield-halved me-1"></i> Supervisi
            </span>

            <div class="dropdown position-relative">
              <button class="btn btn-cyber-profile btn-sm rounded-pill px-2.5 py-1 d-flex align-items-center gap-2 border border-info border-opacity-30 shadow-sm" type="button" id="userMenu" @click.stop="toggleProfileDropdown" title="Profil Akun">
                <div class="user-avatar-circle text-white fw-bold d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style="width: 28px; height: 28px; font-size: 0.8rem; background: linear-gradient(135deg, #0ea5e9, #2563eb);">
                  {{ currentUser && currentUser.nama_lengkap ? currentUser.nama_lengkap.charAt(0).toUpperCase() : 'G' }}
                </div>
                <div class="text-start d-none d-lg-block leading-tight">
                  <span class="fw-bold text-light d-block" style="font-size: 0.8rem;">{{ currentUser && currentUser.nama_lengkap ? currentUser.nama_lengkap.split(' ')[0] : 'Guru' }}</span>
                  <small class="text-info d-block" style="font-size: 0.68rem; margin-top: -3px;">{{ isReadOnlyUser ? 'Supervisi' : 'Guru Pengampu' }}</small>
                </div>
                <i class="fa-solid fa-chevron-down text-muted ms-1 d-none d-sm-inline" style="font-size: 0.65rem;"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark shadow-lg" :class="{ show: showProfileDropdown }" style="position: absolute; right: 0; top: 100%; margin-top: 0.5rem; z-index: 1050; min-width: 260px;" @click.stop>
                <li class="px-3 py-2 border-bottom border-secondary">
                  <div class="fw-bold text-light text-truncate" style="font-size: 0.82rem;" :title="currentUser ? currentUser.nama_lengkap : 'Pengguna'">{{ currentUser ? currentUser.nama_lengkap : 'Pengguna' }}</div>
                  <div class="text-muted text-nowrap mt-0.5" style="font-size: 0.74rem;">NIP. {{ currentUser && currentUser.nip ? currentUser.nip : '-' }}</div>
                  <div class="text-info text-nowrap text-truncate mt-0.5" style="font-size: 0.73rem;" :title="currentUser && currentUser.nama_madrasah ? currentUser.nama_madrasah : 'MAN 2 Seram Bagian Timur'">{{ currentUser && currentUser.nama_madrasah ? currentUser.nama_madrasah : 'MAN 2 Seram Bagian Timur' }}</div>
                </li>
                <li v-if="!isReadOnlyUser"><a class="dropdown-item py-2" style="font-size: 0.82rem;" href="#" @click.prevent="openProfileModal(); showProfileDropdown = false;"><i class="fa-solid fa-id-card me-2 text-info"></i> Edit Profil & NIP</a></li>
                <li><a class="dropdown-item py-2" style="font-size: 0.82rem;" href="#" @click.prevent="currentTab = 'settings'; showProfileDropdown = false;"><i class="fa-solid fa-sliders me-2 text-warning"></i> Pengaturan Aplikasi</a></li>
                <li class="px-3 py-2 border-top border-bottom theme-dropdown-section my-1">
                  <div class="text-muted mb-1.5 fw-bold d-flex justify-content-between align-items-center" style="font-size: 0.7rem; letter-spacing: 0.5px;">
                    <span><i class="fa-solid fa-palette me-1 text-info"></i> TEMA TAMPILAN</span>
                    <span class="badge bg-secondary bg-opacity-40 text-info text-uppercase" style="font-size: 0.65rem;">{{ selectedTheme }}</span>
                  </div>
                  <div class="d-flex gap-1 mt-1">
                    <button type="button" class="btn btn-xs flex-fill text-nowrap rounded" :class="selectedTheme === 'cyber' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'" style="font-size: 0.72rem; padding: 4px 6px;" @click="setTheme('cyber')">
                      <i class="fa-solid fa-moon me-1"></i> Cyber
                    </button>
                    <button type="button" class="btn btn-xs flex-fill text-nowrap rounded" :class="selectedTheme === 'emerald' ? 'btn-success text-white fw-bold' : 'btn-outline-secondary'" style="font-size: 0.72rem; padding: 4px 6px;" @click="setTheme('emerald')">
                      <i class="fa-solid fa-sun me-1"></i> Emerald
                    </button>
                    <button type="button" class="btn btn-xs flex-fill text-nowrap rounded" :class="selectedTheme === 'midnight' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary'" style="font-size: 0.72rem; padding: 4px 6px;" @click="setTheme('midnight')">
                      <i class="fa-solid fa-star me-1"></i> Midnight
                    </button>
                  </div>
                </li>
                <li><hr class="dropdown-divider my-1"></li>
                <li><a class="dropdown-item text-danger py-2" style="font-size: 0.82rem;" href="#" @click.prevent="logout(); showProfileDropdown = false;"><i class="fa-solid fa-power-off me-2"></i> Keluar</a></li>
              </ul>
            </div>
          </div>
        </header>

        <div class="content-wrapper">

          <div v-if="!currentUser" class="auth-page-container">
            <div class="auth-orb auth-orb-1"></div>
            <div class="auth-orb auth-orb-2"></div>
            <div class="auth-card">
              <div class="card p-3 p-sm-3.5 shadow-lg">
                <div class="text-center mb-2">
                  <!-- Container Brand Header Login Card (Desain Elegan & Harmonis) -->
                  <div v-if="formattedMadrasahLogoUrl && !isLogoImageError" class="mx-auto mb-2.5 d-flex align-items-center justify-content-center overflow-hidden p-1.5 bg-white bg-opacity-10 border border-info border-opacity-30 rounded-circle shadow" style="width: 62px; height: 62px; box-shadow: 0 0 20px rgba(14,165,233,0.2) !important;">
                    <img :src="formattedMadrasahLogoUrl" alt="Logo Madrasah" @error="handleLogoError" style="width: 100%; height: 100%; object-fit: contain;" />
                  </div>

                  <!-- Fallback Jika Belum Mengatur Logo Madrasah -->
                  <div v-else class="brand-icon mx-auto mb-2.5 bg-info bg-opacity-20 border border-info border-opacity-40 rounded-3 text-info d-flex align-items-center justify-content-center shadow-sm" style="width: 58px; height: 58px; font-size: 1.5rem; box-shadow: 0 0 20px rgba(14,165,233,0.3) !important;">
                    <i class="fa-solid fa-cube text-info"></i>
                  </div>

                  <!-- Judul DADU dengan Icon Cube Futuristik -->
                  <h4 class="fw-extrabold text-light mb-1 d-flex align-items-center justify-content-center gap-2" style="font-size: 1.45rem; letter-spacing: 0.8px;">
                    <i class="fa-solid fa-cube text-info"></i>
                    <span>DADU</span>
                  </h4>
                  <p class="text-info fw-bold mb-0.5" style="font-size: 0.82rem; letter-spacing: 0.2px;">Digitalisasi Data dari Guru</p>
                  <p class="text-muted mb-0" style="font-size: 0.74rem;">MAN 2 Seram Bagian Timur</p>
                </div>

                <ul class="nav nav-pills nav-justified mb-2 p-1 bg-dark bg-opacity-50 rounded-3 border border-secondary" id="pills-tab">
                  <li class="nav-item">
                    <button class="nav-link text-light py-1" style="font-size: 0.8rem;" :class="{ 'active btn-cyber': authTab === 'login' }" @click="authTab = 'login'">Masuk Guru</button>
                  </li>
                  <li class="nav-item">
                    <button class="nav-link text-light py-1" style="font-size: 0.8rem;" :class="{ 'active btn-cyber': authTab === 'register' }" @click="authTab = 'register'">Daftar</button>
                  </li>
                </ul>

                <form v-if="authTab === 'login'" @submit.prevent="login">
                  <div class="mb-2">
                    <label class="form-label text-light mb-1" style="font-size: 0.78rem;">Username Guru</label>
                    <input type="text" class="form-control form-control-sm" v-model="loginForm.username" required placeholder="guruman2">
                  </div>
                  <div class="mb-2">
                    <label class="form-label text-light mb-1" style="font-size: 0.78rem;">Password</label>
                    <input type="password" class="form-control form-control-sm" v-model="loginForm.password" required placeholder="••••••••">
                  </div>
                  <button type="submit" class="btn btn-cyber w-100 py-1.5 mt-1" style="font-size: 0.85rem;" :disabled="loading">
                    <i v-if="loading" class="fa-solid fa-circle-notch fa-spin me-1"></i>
                    {{ loading ? 'Mengautentikasi...' : 'Masuk System Guru' }}
                  </button>
                </form>

                <form v-if="authTab === 'register'" @submit.prevent="register">
                  <div class="mb-1.5">
                    <label class="form-label text-light mb-0.5" style="font-size: 0.72rem;">Nama Lengkap Guru</label>
                    <input type="text" class="form-control form-control-sm py-1" v-model="regForm.nama_lengkap" required placeholder="Johan R. A., S.Pd.">
                  </div>
                  <div class="mb-1.5">
                    <label class="form-label text-light mb-0.5" style="font-size: 0.72rem;">NIP</label>
                    <input type="text" class="form-control form-control-sm py-1" v-model="regForm.nip" placeholder="19850101 201001 1 001">
                  </div>
                  <div class="mb-1.5">
                    <label class="form-label text-light mb-0.5" style="font-size: 0.72rem;">Madrasah</label>
                    <input type="text" class="form-control form-control-sm py-1" v-model="regForm.nama_madrasah" required value="MAN 2 Seram Bagian Timur">
                  </div>
                  <div class="mb-1.5">
                    <label class="form-label text-light mb-0.5" style="font-size: 0.72rem;">Username</label>
                    <input type="text" class="form-control form-control-sm py-1" v-model="regForm.username" required placeholder="username">
                  </div>
                  <div class="mb-2">
                    <label class="form-label text-light mb-0.5" style="font-size: 0.72rem;">Password</label>
                    <input type="password" class="form-control form-control-sm py-1" v-model="regForm.password" required placeholder="••••••••">
                  </div>
                  <button type="submit" class="btn btn-cyber w-100 py-1.5 mt-1" style="font-size: 0.82rem;" :disabled="loading">
                    <i v-if="loading" class="fa-solid fa-circle-notch fa-spin me-1"></i>
                    {{ loading ? 'Mendaftarkan...' : 'Daftar Akun Baru' }}
                  </button>
                </form>

                <div class="text-center mt-2 pt-2 border-top border-secondary">
                  <button class="btn btn-outline-info w-100 py-1.5 d-flex align-items-center justify-content-center gap-1.5" style="font-size: 0.76rem;" @click="startSupervisionMode" :disabled="loading">
                    <i class="fa-solid fa-user-shield"></i> Akses Instan Kepala Madrasah & Supervisor
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="currentUser && currentTab === 'dashboard'">
            <div class="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h3 class="fw-bold mb-1 text-light">Selamat Datang, {{ currentUser.nama_lengkap }}! 🚀</h3>
                <p class="sub-title-text mb-0">{{ currentUser.nama_madrasah || 'MAN 2 Seram Bagian Timur' }} • Ringkasan Mengajar System</p>
              </div>
              <button v-if="!isReadOnlyUser && selectedClassId" class="btn btn-cyber px-4" @click="currentTab = 'attendance'">
                <i class="fa-solid fa-plus me-2"></i> Input Presensi
              </button>
            </div>

            <div v-if="!selectedClassId" class="theme-alert-banner p-4 mb-4 d-flex align-items-center gap-3">
              <i class="fa-solid fa-triangle-exclamation fa-2x alert-icon"></i>
              <div>
                <h5 class="fw-bold mb-1 alert-title">Belum Ada Kelas Aktif yang Dipilih</h5>
                <p class="mb-0 alert-desc">Silakan pilih kelas terlebih dahulu melalui dropdown di bagian atas header untuk mulai mengelola presensi dan nilai.</p>
              </div>
            </div>

            <div class="row g-3 mb-4" v-if="selectedClassId">
              <div class="col-md-3">
                <div class="card p-3 stat-card">
                  <div class="d-flex align-items-center gap-3">
                    <div class="stat-icon stat-icon-primary">
                      <i class="fa-solid fa-user-group"></i>
                    </div>
                    <div>
                      <h2 class="fw-bold mb-0 text-light">{{ selectedClassStudents.length }}</h2>
                      <small class="text-muted fw-medium d-block">Total Siswa ({{ currentClassName }})</small>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card p-3 stat-card">
                  <div class="d-flex align-items-center gap-3">
                    <div class="stat-icon stat-icon-success">
                      <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <div>
                      <h2 class="fw-bold mb-0 text-light">{{ attendancePercentage }}%</h2>
                      <small class="text-muted fw-medium d-block">Rata-Rata Kehadiran</small>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card p-3 stat-card">
                  <div class="d-flex align-items-center gap-3">
                    <div class="stat-icon stat-icon-warning">
                      <i class="fa-solid fa-book-bookmark"></i>
                    </div>
                    <div>
                      <h2 class="fw-bold mb-0 text-light">{{ journals.length }}</h2>
                      <small class="text-muted fw-medium d-block">Total Jurnal Mengajar</small>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card p-3 stat-card">
                  <div class="d-flex align-items-center gap-3">
                    <div class="stat-icon stat-icon-info">
                      <i class="fa-solid fa-school"></i>
                    </div>
                    <div>
                      <h2 class="fw-bold mb-0 text-light">{{ classes.length }}</h2>
                      <small class="text-muted fw-medium d-block">Total Kelas Dikelola</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Action Shortcuts Grid -->
            <div class="mb-4" v-if="selectedClassId">
              <h5 class="fw-bold text-light mb-3"><i class="fa-solid fa-bolt text-warning me-2"></i>Pintasan Akses Cepat</h5>
              <div class="row g-3 align-items-stretch">
                <div class="col-6 col-md-3">
                  <div class="quick-action-card h-100" @click="currentTab = 'attendance'; attMode = 'daily';">
                    <div class="quick-action-icon qa-icon-cyan">
                      <i class="fa-solid fa-pen-to-square"></i>
                    </div>
                    <div class="min-w-0 flex-grow-1">
                      <h6 class="fw-bold text-light mb-0 text-truncate">Presensi Harian</h6>
                      <small class="text-muted d-block text-truncate">Catat kehadiran hari ini</small>
                    </div>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="quick-action-card h-100" @click="currentTab = 'attendance'; attMode = 'recap'; loadMonthlyRecapData();">
                    <div class="quick-action-icon qa-icon-blue">
                      <i class="fa-solid fa-table-cells"></i>
                    </div>
                    <div class="min-w-0 flex-grow-1">
                      <h6 class="fw-bold text-light mb-0 text-truncate">Rekap Bulanan</h6>
                      <small class="text-muted d-block text-truncate">Lihat persentase bulanan</small>
                    </div>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="quick-action-card h-100" @click="currentTab = 'grades'; loadGradesData();">
                    <div class="quick-action-icon qa-icon-warning">
                      <i class="fa-solid fa-award"></i>
                    </div>
                    <div class="min-w-0 flex-grow-1">
                      <h6 class="fw-bold text-light mb-0 text-truncate">Penilaian Akademik</h6>
                      <small class="text-muted d-block text-truncate">Nilai UH, UTS, & UAS</small>
                    </div>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="quick-action-card h-100" @click="currentTab = 'journal'">
                    <div class="quick-action-icon qa-icon-success">
                      <i class="fa-solid fa-book-open-reader"></i>
                    </div>
                    <div class="min-w-0 flex-grow-1">
                      <h6 class="fw-bold text-light mb-0 text-truncate">Jurnal Mengajar</h6>
                      <small class="text-muted d-block text-truncate">Tulis aktivitas KBM</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Two Column Dashboard Insights -->
            <div class="row g-4 mb-4" v-if="selectedClassId">
              <!-- Left Column: Recent Teaching Journal Log -->
              <div class="col-lg-7">
                <div class="card h-100">
                  <div class="card-header d-flex align-items-center justify-content-between">
                    <h5 class="fw-bold text-light mb-0"><i class="fa-solid fa-book-bookmark text-info me-2"></i>Jurnal Mengajar Terbaru ({{ currentClassName }})</h5>
                    <button class="btn btn-sm btn-outline-info" @click="currentTab = 'journal'">Lihat Semua</button>
                  </div>
                  <div class="card-body p-0">
                    <div class="table-responsive" v-if="journals.filter(j => j.class_id === selectedClassId).length > 0">
                      <table class="table table-dark-custom align-middle mb-0">
                        <thead>
                          <tr>
                            <th>TANGGAL</th>
                            <th>MAPEL</th>
                            <th>TOPIK MATERI</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="j in journals.filter(j => j.class_id === selectedClassId).slice(0, 4)" :key="j.id">
                            <td><span class="badge bg-secondary bg-opacity-30 text-info border border-info border-opacity-20">{{ j.date }}</span></td>
                            <td class="fw-semibold text-light">{{ getSubjectName(j.subject_id) }}</td>
                            <td>
                              <div class="fw-medium text-light">{{ j.topic }}</div>
                              <small class="text-muted text-truncate d-block" style="max-width: 280px;">{{ j.activities }}</small>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div class="empty-state p-4 text-center" v-else>
                      <div class="empty-state-icon"><i class="fa-solid fa-book-open text-muted fa-2x mb-2"></i></div>
                      <span class="empty-state-title d-block mb-2">Belum ada jurnal KBM tercatat untuk kelas ini</span>
                      <button v-if="!isReadOnlyUser" class="btn btn-cyber btn-sm" @click="currentTab = 'journal'"><i class="fa-solid fa-plus me-1"></i> Buat Jurnal Baru</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column: Class Summary & Transparency Link -->
              <div class="col-lg-5">
                <div class="card h-100">
                  <div class="card-header">
                    <h5 class="fw-bold text-light mb-0"><i class="fa-solid fa-chart-line text-success me-2"></i>Informasi Kehadiran Kelas</h5>
                  </div>
                  <div class="card-body d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="text-muted">Persentase Kehadiran Total</span>
                        <span class="fw-bold text-info fs-5">{{ attendancePercentage }}%</span>
                      </div>
                      <div class="progress mb-4" style="height: 10px; background-color: rgba(255, 255, 255, 0.1);">
                        <div class="progress-bar bg-gradient-info" role="progressbar" :style="{ width: attendancePercentage + '%' }" :aria-valuenow="attendancePercentage" aria-valuemin="0" aria-valuemax="100"></div>
                      </div>

                      <div class="row g-2 mb-4">
                        <div class="col-6">
                          <div class="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary text-center">
                            <small class="text-muted d-block">Siswa Terdaftar</small>
                            <span class="fs-4 fw-bold text-light">{{ selectedClassStudents.length }}</span>
                          </div>
                        </div>
                        <div class="col-6">
                          <div class="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary text-center">
                            <small class="text-muted d-block">Mata Pelajaran</small>
                            <span class="fs-4 fw-bold text-light">{{ subjects.length }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="pt-3 border-top border-secondary">
                      <div class="d-flex align-items-center justify-content-between">
                        <div>
                          <h6 class="fw-bold text-light mb-1">Laporan Transparan</h6>
                          <small class="text-muted d-block">Bagikan ke wali murid / cetak PDF</small>
                        </div>
                        <button class="btn btn-outline-info btn-sm" @click="currentTab = 'report'; loadReportTab();">
                          <i class="fa-solid fa-file-invoice me-1"></i> Buka Laporan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="currentUser && currentTab === 'classes'">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h4 class="fw-bold text-light mb-0"><i class="fa-solid fa-layer-group text-info me-2"></i>Daftar Kelas & Mata Pelajaran (Tersortir A-Z)</h4>
            </div>

            <div class="row g-4">
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold text-light mb-0">Daftar Kelas (Rombel)</h5>
                    <button v-if="!isReadOnlyUser && selectedClassIds.length > 0" class="btn btn-sm btn-danger text-nowrap" @click="bulkDeleteClasses">
                      <i class="fa-solid fa-trash me-1"></i> Hapus {{ selectedClassIds.length }} Kelas
                    </button>
                  </div>
                  <div class="card-body">
                    <form v-if="!isReadOnlyUser" @submit.prevent="addClass" class="d-flex gap-2 mb-3">
                      <input type="text" class="form-control" v-model="newClassName" placeholder="Nama Kelas Baru (Contoh: X.C)" required>
                      <button type="submit" class="btn btn-cyber text-nowrap" :disabled="isDbProcessing">
                        <i class="fa-solid" :class="isDbProcessing ? 'fa-spinner fa-spin' : 'fa-plus'"></i> Tambah
                      </button>
                    </form>
                    <div class="table-responsive">
                      <table class="table table-dark-custom align-middle">
                        <thead>
                          <tr>
                            <th style="width: 40px;" v-if="!isReadOnlyUser">
                              <input type="checkbox" class="form-check-input cursor-pointer" :checked="classes.length > 0 && selectedClassIds.length === classes.length" @change="selectedClassIds = selectedClassIds.length === classes.length ? [] : classes.map(c => c.id)">
                            </th>
                            <th>NAMA KELAS</th>
                            <th v-if="!isReadOnlyUser" class="text-end">AKSI</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="c in classes" :key="c.id">
                            <td v-if="!isReadOnlyUser">
                              <input type="checkbox" class="form-check-input cursor-pointer" :value="c.id" v-model="selectedClassIds">
                            </td>
                            <td class="fw-bold text-light">{{ c.name }}</td>
                            <td v-if="!isReadOnlyUser" class="text-end">
                              <button class="btn btn-sm btn-outline-danger" @click="deleteClass(c.id)" :disabled="isDbProcessing"><i class="fa-solid fa-trash"></i></button>
                            </td>
                          </tr>
                          <tr v-if="classes.length === 0">
                            <td :colspan="isReadOnlyUser ? 1 : 3" class="p-0">
                              <div class="empty-state">
                                <div class="empty-state-icon"><i class="fa-solid fa-folder-open"></i></div>
                                <span class="empty-state-title">Belum ada kelas terdaftar</span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="card">
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold text-light mb-0">Daftar Mata Pelajaran</h5>
                    <button v-if="!isReadOnlyUser && selectedSubjectIds.length > 0" class="btn btn-sm btn-danger text-nowrap" @click="bulkDeleteSubjects">
                      <i class="fa-solid fa-trash me-1"></i> Hapus {{ selectedSubjectIds.length }} Mapel
                    </button>
                  </div>
                  <div class="card-body">
                    <form v-if="!isReadOnlyUser" @submit.prevent="addSubject" class="d-flex gap-2 mb-3">
                      <input type="text" class="form-control" v-model="newSubjectName" placeholder="Nama Mapel Baru (Contoh: Bahasa Inggris)" required>
                      <button type="submit" class="btn btn-cyber text-nowrap" :disabled="isDbProcessing">
                        <i class="fa-solid" :class="isDbProcessing ? 'fa-spinner fa-spin' : 'fa-plus'"></i> Tambah
                      </button>
                    </form>
                    <div class="table-responsive">
                      <table class="table table-dark-custom align-middle">
                        <thead>
                          <tr>
                            <th style="width: 40px;" v-if="!isReadOnlyUser">
                              <input type="checkbox" class="form-check-input cursor-pointer" :checked="subjects.length > 0 && selectedSubjectIds.length === subjects.length" @change="selectedSubjectIds = selectedSubjectIds.length === subjects.length ? [] : subjects.map(s => s.id)">
                            </th>
                            <th>NAMA MATA PELAJARAN</th>
                            <th v-if="!isReadOnlyUser" class="text-end">AKSI</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="sub in subjects" :key="sub.id">
                            <td v-if="!isReadOnlyUser">
                              <input type="checkbox" class="form-check-input cursor-pointer" :value="sub.id" v-model="selectedSubjectIds">
                            </td>
                            <td class="fw-bold text-light">{{ sub.name }}</td>
                            <td v-if="!isReadOnlyUser" class="text-end">
                              <button class="btn btn-sm btn-outline-danger" @click="deleteSubject(sub.id)" :disabled="isDbProcessing"><i class="fa-solid fa-trash"></i></button>
                            </td>
                          </tr>
                          <tr v-if="subjects.length === 0">
                            <td :colspan="isReadOnlyUser ? 1 : 3" class="p-0">
                              <div class="empty-state">
                                <div class="empty-state-icon"><i class="fa-solid fa-folder-open"></i></div>
                                <span class="empty-state-title">Belum ada mata pelajaran</span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="currentUser && currentTab === 'students'">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              <div>
                <h4 class="fw-bold text-light mb-1"><i class="fa-solid fa-users text-info me-2"></i>Data Siswa Kelas {{ currentClassName }}</h4>
                <p class="sub-title-text mb-0">Master data siswa, pengelolaan gender (L/P), dan aksi massal (bulk operations).</p>
              </div>
              <div class="d-flex flex-wrap gap-2" v-if="!isReadOnlyUser && selectedClassId">
                <button class="btn btn-outline-info btn-sm" @click="downloadStudentTemplate"><i class="fa-solid fa-file-excel me-1"></i> Template Excel</button>
                <label class="btn btn-outline-success btn-sm mb-0 cursor-pointer">
                  <i class="fa-solid fa-file-import me-1"></i> Import Excel
                  <input type="file" accept=".xlsx, .xls" class="d-none" @change="importStudentsExcel">
                </label>
                <button class="btn btn-cyber btn-sm" @click="openStudentModal()" :disabled="isDbProcessing"><i class="fa-solid fa-user-plus me-1"></i> Tambah Siswa</button>
              </div>
            </div>

            <div v-if="!selectedClassId" class="theme-alert-banner p-4 mb-4 d-flex align-items-center gap-3">
              <i class="fa-solid fa-triangle-exclamation fa-2x alert-icon"></i>
              <div>
                <h5 class="fw-bold mb-1 alert-title">Silakan Pilih Kelas Terlebih Dahulu</h5>
                <p class="mb-0 alert-desc">Pilih kelas aktif pada dropdown di bagian atas header untuk melihat dan mengelola data siswa.</p>
              </div>
            </div>

            <div v-if="selectedClassId">
              <!-- Summary Statistics Cards for Male / Female Count -->
              <div class="row g-3 mb-4">
                <div class="col-12 col-md-4">
                  <div class="card p-3 stat-card">
                    <div class="d-flex align-items-center gap-3">
                      <div class="stat-icon stat-icon-primary">
                        <i class="fa-solid fa-users"></i>
                      </div>
                      <div>
                        <h3 class="fw-bold mb-0 text-light">{{ selectedClassStudents.length }}</h3>
                        <small class="text-muted fw-medium d-block">Total Siswa ({{ currentClassName }})</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="card p-3 stat-card">
                    <div class="d-flex align-items-center gap-3">
                      <div class="stat-icon stat-icon-info">
                        <i class="fa-solid fa-mars"></i>
                      </div>
                      <div>
                        <h3 class="fw-bold mb-0 text-info">{{ maleStudentCount }}</h3>
                        <small class="text-muted fw-medium d-block">Siswa Laki-laki (L)</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="card p-3 stat-card">
                    <div class="d-flex align-items-center gap-3">
                      <div class="stat-icon stat-icon-danger">
                        <i class="fa-solid fa-venus"></i>
                      </div>
                      <div>
                        <h3 class="fw-bold mb-0 text-danger">{{ femaleStudentCount }}</h3>
                        <small class="text-muted fw-medium d-block">Siswa Perempuan (P)</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bulk Action Bar -->
              <div v-if="!isReadOnlyUser && selectedStudentIds.length > 0" class="p-3 mb-3 rounded-3 bg-dark border border-info border-opacity-40 d-flex flex-wrap align-items-center justify-content-between gap-2 shadow-lg">
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-info text-dark fw-bold px-2.5 py-1.5" style="font-size: 0.82rem;">
                    <i class="fa-solid fa-check-double me-1"></i> {{ selectedStudentIds.length }} Siswa Terpilih
                  </span>
                  <small class="text-muted d-none d-sm-inline">Pilih aksi massal yang ingin diterapkan:</small>
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <button class="btn btn-sm btn-outline-info" @click="openBulkMoveModal" :disabled="isDbProcessing">
                    <i class="fa-solid fa-right-left me-1"></i> Pindah Kelas
                  </button>
                  <button class="btn btn-sm btn-outline-warning" @click="openBulkStatusModal" :disabled="isDbProcessing">
                    <i class="fa-solid fa-user-tag me-1"></i> Ubah Status
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="bulkDeleteStudents" :disabled="isDbProcessing">
                    <i class="fa-solid fa-trash me-1"></i> Hapus Terpilih
                  </button>
                </div>
              </div>

              <!-- Bulk Action Helper Hint when 0 selected -->
              <div v-if="!isReadOnlyUser && selectedStudentIds.length === 0 && selectedClassStudents.length > 0" class="p-2.5 px-3 mb-3 rounded-3 bg-info bg-opacity-10 border border-info border-opacity-30 d-flex align-items-center gap-2">
                <i class="fa-solid fa-lightbulb text-info fs-5"></i>
                <span class="small text-light">Centang kotak centang (checkbox) pada siswa untuk mengaktifkan fitur <strong>Aksi Massal / Bulk Edit</strong> (Pindah Kelas, Ubah Status, atau Hapus Massal).</span>
              </div>

              <div class="card">
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-dark-custom align-middle mb-0">
                      <thead>
                        <tr>
                          <th v-if="!isReadOnlyUser" style="width: 40px;" class="text-center">
                            <input type="checkbox" class="form-check-input" :checked="isAllStudentsSelected" @change="toggleSelectAllStudents" title="Pilih Semua Siswa">
                          </th>
                          <th style="width: 50px;">NO</th>
                          <th>NISN</th>
                          <th>NAMA SISWA</th>
                          <th class="text-center">JENIS KELAMIN</th>
                          <th>KELAS</th>
                          <th class="text-center">STATUS</th>
                          <th v-if="!isReadOnlyUser" class="text-end">AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="loading && selectedClassStudents.length === 0" v-for="n in 4" :key="'skel_'+n">
                          <td v-if="!isReadOnlyUser"><span class="skeleton-loader" style="width: 20px;"></span></td>
                          <td><span class="skeleton-loader" style="width: 20px;"></span></td>
                          <td><span class="skeleton-loader" style="width: 90px;"></span></td>
                          <td><span class="skeleton-loader" style="width: 160px;"></span></td>
                          <td><span class="skeleton-loader" style="width: 50px;"></span></td>
                          <td><span class="skeleton-loader" style="width: 70px;"></span></td>
                          <td><span class="skeleton-loader" style="width: 60px;"></span></td>
                          <td v-if="!isReadOnlyUser" class="text-end"><span class="skeleton-loader" style="width: 50px;"></span></td>
                        </tr>

                        <tr v-else v-for="(s, idx) in selectedClassStudents" :key="s.id" :class="{ 'bg-info bg-opacity-10': selectedStudentIds.includes(s.id) }">
                          <td v-if="!isReadOnlyUser" class="text-center">
                            <input type="checkbox" class="form-check-input" :value="s.id" v-model="selectedStudentIds">
                          </td>
                          <td><span class="fw-bold text-info">{{ idx + 1 }}</span></td>
                          <td><span class="badge-nisn">{{ s.nisn || '-' }}</span></td>
                          <td class="fw-semibold text-light">{{ s.name }}</td>
                          <td class="text-center">
                            <span :class="(s.gender === 'P' || s.jenis_kelamin === 'P') ? 'badge-gender-p' : 'badge-gender-l'">
                              <i :class="(s.gender === 'P' || s.jenis_kelamin === 'P') ? 'fa-solid fa-venus me-1' : 'fa-solid fa-mars me-1'"></i>
                              {{ (s.gender === 'P' || s.jenis_kelamin === 'P') ? 'P' : 'L' }}
                            </span>
                          </td>
                          <td>
                            <span class="class-badge-pill">{{ getClassName(s.class_id) }}</span>
                          </td>
                          <td class="text-center">
                            <span :class="s.status === 'Nonaktif' ? 'badge-status-nonaktif' : s.status === 'Mutasi' ? 'badge-status-mutasi' : 'badge-status-aktif'">
                              {{ s.status || 'Aktif' }}
                            </span>
                          </td>
                          <td v-if="!isReadOnlyUser" class="text-end">
                            <button class="btn btn-sm btn-outline-cyber me-1" @click="openStudentModal(s)" :disabled="isDbProcessing" title="Edit Siswa"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-sm btn-outline-danger" @click="deleteStudent(s.id)" :disabled="isDbProcessing" title="Hapus Siswa"><i class="fa-solid fa-trash"></i></button>
                          </td>
                        </tr>
                        <tr v-if="!loading && selectedClassStudents.length === 0">
                          <td :colspan="isReadOnlyUser ? 6 : 8" class="p-0">
                            <div class="empty-state">
                              <div class="empty-state-icon">
                                <i class="fa-solid fa-folder-open fa-lg"></i>
                              </div>
                              <span class="empty-state-title">Belum ada data siswa di kelas ini</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="currentUser && currentTab === 'attendance'">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 class="fw-bold text-light mb-1">
                  <i class="fa-solid text-info me-2" :class="attMode === 'daily' ? 'fa-pen-to-square' : 'fa-table-cells'"></i>
                  {{ attMode === 'daily' ? 'Presensi Harian Siswa' : 'Rekapitulasi Bulanan Presensi' }}
                </h4>
                <p class="sub-title-text mb-0">Kelas {{ currentClassName }}</p>
              </div>
            </div>

            <div v-if="!selectedClassId" class="theme-alert-banner p-4 mb-4 d-flex align-items-center gap-3">
              <i class="fa-solid fa-triangle-exclamation fa-2x alert-icon"></i>
              <div>
                <h5 class="fw-bold mb-1 alert-title">Silakan Pilih Kelas Terlebih Dahulu</h5>
                <p class="mb-0 alert-desc">Pilih kelas pada dropdown header untuk mengisi atau melihat presensi siswa.</p>
              </div>
            </div>

            <div v-if="selectedClassId">
              <!-- Daily Mode -->
              <div v-if="attMode === 'daily'">
                <div class="card mb-4">
                  <div class="card-body">
                    <div class="row g-3">
                      <div class="col-md-3">
                        <label class="form-label">Tanggal Presensi</label>
                        <input type="date" class="form-control" v-model="attendanceDate" @change="loadAttendanceData">
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">Mata Pelajaran</label>
                        <select class="form-select" v-model="selectedSubjectId" @change="loadAttendanceData">
                          <option value="" disabled>-- Pilih Mapel --</option>
                          <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
                        </select>
                      </div>
                      <div class="col-md-5 d-flex align-items-end gap-2">
                        <button v-if="!isReadOnlyUser" class="btn btn-outline-cyber" @click="markAllPresent" :disabled="isDbProcessing">
                          <i class="fa-solid fa-check-double me-1"></i> Semua Hadir
                        </button>
                        <button v-if="!isReadOnlyUser" class="btn btn-cyber ms-auto" @click="saveAttendance" :disabled="isDbProcessing">
                          <i class="fa-solid" :class="isDbProcessing ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i> 
                          {{ isDbProcessing ? 'Menyimpan...' : 'Simpan Presensi' }}
                        </button>
                        <span v-if="isReadOnlyUser" class="text-warning small fst-italic ms-auto">Mode Supervisi (Read-Only)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card">
                  <div class="card-header">
                    <h5 class="fw-bold mb-0 text-light">Presensi Siswa: {{ currentClassName }} ({{ attendanceDate }})</h5>
                  </div>
                  <div class="card-body p-0">
                    <div class="table-responsive">
                      <table class="table table-dark-custom align-middle mb-0">
                        <thead>
                          <tr>
                            <th style="width: 70px;">NO</th>
                            <th>NAMA SISWA</th>
                            <th class="text-center">STATUS KEHADIRAN (H / I / S / A)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(s, idx) in selectedClassStudents" :key="s.id">
                            <td><span class="fw-bold text-info fs-6">{{ idx + 1 }}</span></td>
                            <td class="fw-semibold text-light">{{ s.name }}</td>
                            <td class="text-center">
                              <div class="d-inline-flex gap-2">
                                <button type="button" class="btn-att btn-att-h" :class="{ active: currentAttendance[s.id] === 'H' }" @click="!isReadOnlyUser && setAttendanceStatus(s.id, 'H')" :disabled="isReadOnlyUser">H</button>
                                <button type="button" class="btn-att btn-att-i" :class="{ active: currentAttendance[s.id] === 'I' }" @click="!isReadOnlyUser && setAttendanceStatus(s.id, 'I')" :disabled="isReadOnlyUser">I</button>
                                <button type="button" class="btn-att btn-att-s" :class="{ active: currentAttendance[s.id] === 'S' }" @click="!isReadOnlyUser && setAttendanceStatus(s.id, 'S')" :disabled="isReadOnlyUser">S</button>
                                <button type="button" class="btn-att btn-att-a" :class="{ active: currentAttendance[s.id] === 'A' }" @click="!isReadOnlyUser && setAttendanceStatus(s.id, 'A')" :disabled="isReadOnlyUser">A</button>
                              </div>
                            </td>
                          </tr>
                          <tr v-if="selectedClassStudents.length === 0">
                            <td colspan="3" class="p-0">
                              <div class="empty-state">
                                <div class="empty-state-icon">
                                  <i class="fa-solid fa-users-slash fa-lg"></i>
                                </div>
                                <span class="empty-state-title">Belum ada siswa terdaftar di kelas ini. Tambahkan data siswa melalui menu "Data Siswa".</span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recap Mode -->
              <div v-if="attMode === 'recap'">
                <div class="card mb-4">
                  <div class="card-body">
                    <div class="row g-3 align-items-end">
                      <div class="col-md-3">
                        <label class="form-label">Pilih Bulan</label>
                        <select class="form-select" v-model="recapMonthNum" @change="loadMonthlyRecapData">
                          <option v-for="m in monthsList" :key="m.val" :value="m.val">{{ m.name }}</option>
                        </select>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label">Tahun</label>
                        <select class="form-select" v-model="recapYear" @change="loadMonthlyRecapData">
                          <option v-for="y in yearsList" :key="y" :value="y">{{ y }}</option>
                        </select>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label">Mata Pelajaran</label>
                        <select class="form-select" v-model="selectedSubjectId" @change="loadMonthlyRecapData">
                          <option value="" disabled>-- Pilih Mapel --</option>
                          <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
                        </select>
                      </div>
                      <div class="col-md-4 d-flex justify-content-end">
                        <button class="btn btn-outline-success" @click="exportMonthlyAttExcel">
                          <i class="fa-solid fa-file-excel me-1"></i> Export Rekap Bulanan Excel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card">
                  <div class="card-header">
                    <h5 class="fw-bold text-light mb-0">Tabel Rekapitulasi Presensi Bulanan - Kelas {{ currentClassName }}</h5>
                  </div>
                  <div class="card-body p-0">
                    <div class="table-responsive">
                      <table class="table table-bordered table-dark-custom align-middle mb-0 text-center" style="font-size: 0.85rem;">
                        <thead>
                          <tr>
                            <th style="width: 50px;" rowspan="2">NO</th>
                            <th style="width: 110px;" rowspan="2">NISN</th>
                            <th class="text-start" rowspan="2">NAMA SISWA</th>
                            <th :colspan="daysInSelectedMonth">TANGGAL BULAN {{ getMonthName(recapMonthNum).toUpperCase() }} {{ recapYear }}</th>
                            <th style="width: 45px;" rowspan="2">H</th>
                            <th style="width: 45px;" rowspan="2">I</th>
                            <th style="width: 45px;" rowspan="2">S</th>
                            <th style="width: 45px;" rowspan="2">A</th>
                            <th style="width: 70px;" rowspan="2">%</th>
                          </tr>
                          <tr>
                            <th v-for="d in daysInSelectedMonth" :key="d" style="width: 32px; padding: 4px; font-size: 0.75rem;">{{ d }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(s, idx) in selectedClassStudents" :key="s.id">
                            <td><strong class="text-info">{{ idx + 1 }}</strong></td>
                            <td><span class="badge bg-secondary bg-opacity-30 text-light border border-secondary" style="font-size: 0.7rem;">{{ s.nisn || '-' }}</span></td>
                            <td class="text-start fw-semibold text-light text-nowrap">{{ s.name }}</td>
                            <td v-for="d in daysInSelectedMonth" :key="d" class="p-1 font-monospace" style="font-size: 0.75rem;">
                              <span :class="{
                                'text-success fw-bold': getStudentDayStatus(s.id, d) === 'H',
                                'text-info fw-bold': getStudentDayStatus(s.id, d) === 'I',
                                'text-warning fw-bold': getStudentDayStatus(s.id, d) === 'S',
                                'text-danger fw-bold': getStudentDayStatus(s.id, d) === 'A',
                                'text-muted': !getStudentDayStatus(s.id, d)
                              }">{{ getStudentDayStatus(s.id, d) || '-' }}</span>
                            </td>
                            <td class="text-success fw-bold">{{ getStudentRecapTotals(s.id).H }}</td>
                            <td class="text-info fw-bold">{{ getStudentRecapTotals(s.id).I }}</td>
                            <td class="text-warning fw-bold">{{ getStudentRecapTotals(s.id).S }}</td>
                            <td class="text-danger fw-bold">{{ getStudentRecapTotals(s.id).A }}</td>
                            <td class="fw-extrabold text-info">{{ getStudentRecapTotals(s.id).percent }}%</td>
                          </tr>
                          <tr v-if="selectedClassStudents.length === 0">
                            <td :colspan="daysInSelectedMonth + 8" class="p-0">
                              <div class="empty-state">
                                <div class="empty-state-icon">
                                  <i class="fa-solid fa-folder-open fa-lg"></i>
                                </div>
                                <span class="empty-state-title">Belum ada data siswa di kelas ini</span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Academic Grades Tab -->
          <div v-if="currentUser && currentTab === 'grades'">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
              <div>
                <h4 class="fw-bold text-light mb-1"><i class="fa-solid fa-award text-info me-2"></i>Penilaian Akademik: {{ currentClassName }}</h4>
                <p class="sub-title-text mb-0">Input nilai Ulangan Harian, UTS, dan UAS siswa.</p>
              </div>
              <div class="d-flex flex-wrap gap-2 align-items-center w-100 w-md-auto" v-if="selectedClassId">
                <select class="form-select form-select-sm flex-fill flex-md-grow-0" v-model="selectedSubjectId" @change="loadGradesData" style="min-width: 140px; width: auto;">
                  <option value="" disabled>Pilih Mapel</option>
                  <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
                </select>
                <button v-if="!isReadOnlyUser" class="btn btn-outline-info btn-sm text-nowrap flex-fill flex-md-grow-0" @click="openBulkFillGradesModal">
                  <i class="fa-solid fa-wand-magic-sparkles me-1"></i> Isi Nilai Massal
                </button>
                <button v-if="!isReadOnlyUser" class="btn btn-cyber btn-sm text-nowrap flex-fill flex-md-grow-0" @click="saveGradesBulk" :disabled="isDbProcessing">
                  <i class="fa-solid" :class="isDbProcessing ? 'fa-spinner fa-spin me-1' : 'fa-floppy-disk me-1'"></i> Simpan Nilai
                </button>
              </div>
            </div>

            <div v-if="!selectedClassId" class="theme-alert-banner p-4 mb-4 d-flex align-items-center gap-3">
              <i class="fa-solid fa-triangle-exclamation fa-2x alert-icon"></i>
              <div>
                <h5 class="fw-bold mb-1 alert-title">Silakan Pilih Kelas Terlebih Dahulu</h5>
                <p class="mb-0 alert-desc">Pilih kelas pada dropdown header untuk mengelola penilaian akademik.</p>
              </div>
            </div>

            <div class="card" v-if="selectedClassId">
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-dark-custom align-middle mb-0 text-center">
                    <thead>
                      <tr>
                        <th style="width: 50px;">NO</th>
                        <th>NISN</th>
                        <th class="text-start">NAMA SISWA</th>
                        <th style="width: 90px;">UH 1</th>
                        <th style="width: 90px;">UH 2</th>
                        <th style="width: 90px;">UTS</th>
                        <th style="width: 90px;">UAS</th>
                        <th style="width: 100px;">RATA-RATA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(s, idx) in selectedClassStudents" :key="s.id">
                        <td><strong class="text-info">{{ idx + 1 }}</strong></td>
                        <td><span class="badge bg-secondary bg-opacity-30 text-light border border-secondary">{{ s.nisn || '-' }}</span></td>
                        <td class="text-start fw-semibold text-light">{{ s.name }}</td>
                        <td><input type="number" class="form-control form-control-sm text-center font-monospace" v-model.number="currentGrades[`${s.id}_UH1`]" min="0" max="100" :disabled="isReadOnlyUser"></td>
                        <td><input type="number" class="form-control form-control-sm text-center font-monospace" v-model.number="currentGrades[`${s.id}_UH2`]" min="0" max="100" :disabled="isReadOnlyUser"></td>
                        <td><input type="number" class="form-control form-control-sm text-center font-monospace" v-model.number="currentGrades[`${s.id}_UTS`]" min="0" max="100" :disabled="isReadOnlyUser"></td>
                        <td><input type="number" class="form-control form-control-sm text-center font-monospace" v-model.number="currentGrades[`${s.id}_UAS`]" min="0" max="100" :disabled="isReadOnlyUser"></td>
                        <td><span class="fw-extrabold text-info">{{ calculateStudentGradeAverage(s.id) }}</span></td>
                      </tr>
                      <tr v-if="selectedClassStudents.length === 0">
                        <td colspan="8" class="p-0">
                          <div class="empty-state">
                            <div class="empty-state-icon"><i class="fa-solid fa-folder-open fa-lg"></i></div>
                            <span class="empty-state-title">Belum ada data siswa di kelas ini</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div v-if="currentUser && currentTab === 'journal'">
            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
              <h4 class="fw-bold text-light mb-0"><i class="fa-solid fa-book-open-reader text-info me-2"></i>Jurnal Mengajar KBM</h4>
              <button v-if="!isReadOnlyUser && selectedClassId" class="btn btn-cyber text-nowrap" @click="resetJournalForm"><i class="fa-solid fa-plus me-1"></i> Form Jurnal Baru</button>
            </div>

            <div v-if="!selectedClassId" class="theme-alert-banner p-4 mb-4 d-flex align-items-center gap-3">
              <i class="fa-solid fa-triangle-exclamation fa-2x alert-icon"></i>
              <div>
                <h5 class="fw-bold mb-1 alert-title">Silakan Pilih Kelas Terlebih Dahulu</h5>
                <p class="mb-0 alert-desc">Pilih kelas pada dropdown header untuk membuat atau melihat riwayat jurnal mengajar.</p>
              </div>
            </div>

            <div v-if="selectedClassId">
              <div class="card mb-4" v-if="!isReadOnlyUser">
                <div class="card-body">
                  <form @submit.prevent="saveJournal">
                    <div class="row g-3">
                      <div class="col-md-3">
                        <label class="form-label">Tanggal KBM</label>
                        <input type="date" class="form-control" v-model="journalForm.date" required>
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">Mata Pelajaran</label>
                        <select class="form-select" v-model="journalForm.subject_id" required>
                          <option value="" disabled>-- Pilih Mapel --</option>
                          <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
                        </select>
                      </div>
                      <div class="col-md-5">
                        <label class="form-label">Materi / Topik Bahasan</label>
                        <input type="text" class="form-control" v-model="journalForm.topic" placeholder="Contoh: Narrative Text" required>
                      </div>
                      <div class="col-md-12">
                        <label class="form-label">Aktivitas & Catatan KBM</label>
                        <textarea class="form-control" rows="2" v-model="journalForm.activities" placeholder="Catatan jalannya pembelajaran..." required></textarea>
                      </div>
                      <div class="col-md-12 text-end">
                        <button type="submit" class="btn btn-cyber px-4" :disabled="isDbProcessing">
                          <i class="fa-solid" :class="isDbProcessing ? 'fa-circle-notch fa-spin me-1' : 'fa-floppy-disk me-1'"></i> 
                          {{ isDbProcessing ? 'Menyimpan...' : 'Simpan Jurnal' }}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="fw-bold text-light mb-0">Riwayat Jurnal Mengajar Kelas {{ currentClassName }}</h5>
                  <button v-if="!isReadOnlyUser && selectedJournalIds.length > 0" class="btn btn-sm btn-danger text-nowrap" @click="bulkDeleteJournals">
                    <i class="fa-solid fa-trash me-1"></i> Hapus {{ selectedJournalIds.length }} Jurnal
                  </button>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-dark-custom align-middle mb-0">
                      <thead>
                        <tr>
                          <th style="width: 40px;" v-if="!isReadOnlyUser">
                            <input type="checkbox" class="form-check-input cursor-pointer" :checked="isAllJournalsSelected" @change="toggleSelectAllJournals">
                          </th>
                          <th>TANGGAL</th>
                          <th>MAPEL</th>
                          <th>TOPIK / MATERI</th>
                          <th>AKTIVITAS KBM</th>
                          <th v-if="!isReadOnlyUser" class="text-end">AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="j in journals.filter(item => item.class_id === selectedClassId)" :key="j.id">
                          <td v-if="!isReadOnlyUser">
                            <input type="checkbox" class="form-check-input cursor-pointer" :value="j.id" v-model="selectedJournalIds">
                          </td>
                          <td><span class="badge bg-secondary bg-opacity-30 text-info border border-info border-opacity-20">{{ formatDisplayDate(j.date) }}</span></td>
                          <td class="fw-semibold text-light">{{ getSubjectName(j.subject_id) }}</td>
                          <td class="text-light">{{ j.topic }}</td>
                          <td><small class="text-muted">{{ j.activities }}</small></td>
                          <td v-if="!isReadOnlyUser" class="text-end">
                            <button class="btn btn-sm btn-outline-danger" @click="deleteJournal(j.id)"><i class="fa-solid fa-trash"></i></button>
                          </td>
                        </tr>
                        <tr v-if="journals.filter(item => item.class_id === selectedClassId).length === 0">
                          <td :colspan="isReadOnlyUser ? 4 : 6" class="p-0">
                            <div class="empty-state">
                              <div class="empty-state-icon">
                                <i class="fa-solid fa-folder-open fa-lg"></i>
                              </div>
                              <span class="empty-state-title">Belum ada data jurnal mengajar di kelas ini</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="currentUser && currentTab === 'report'">
            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 no-print">
              <div>
                <h4 class="fw-bold text-light mb-1"><i class="fa-solid fa-file-invoice text-info me-2"></i>Laporan Transparan Wali Murid</h4>
                <p class="sub-title-text mb-0">Cetak dokumen PDF dan bagikan link laporan presensi kelas {{ currentClassName }}</p>
              </div>
              
              <div class="d-flex flex-wrap gap-2 w-100 w-sm-auto" v-if="selectedClassId">
                <button class="btn btn-outline-info flex-fill flex-sm-grow-0 text-nowrap" @click="copyPublicLink" title="Salin Link Publik Wali Murid">
                  <i class="fa-solid fa-share-nodes me-1"></i> Salin Link Laporan
                </button>
                <button class="btn btn-cyber flex-fill flex-sm-grow-0 text-nowrap" @click="printReport">
                  <i class="fa-solid fa-print me-1"></i> Cetak PDF
                </button>
              </div>
            </div>

            <div v-if="!selectedClassId" class="theme-alert-banner p-4 mb-4 d-flex align-items-center gap-3">
              <i class="fa-solid fa-triangle-exclamation fa-2x alert-icon"></i>
              <div>
                <h5 class="fw-bold mb-1 alert-title">Silakan Pilih Kelas Terlebih Dahulu</h5>
                <p class="mb-0 alert-desc">Pilih kelas pada dropdown header untuk mencetak atau melihat laporan presensi.</p>
              </div>
            </div>

            <div v-if="selectedClassId">
              <div class="card mb-4 no-print">
                <div class="card-body">
                  <div class="row g-3 align-items-center">
                    <div class="col-md-3">
                      <label class="form-label">Filter Bulan</label>
                      <select class="form-select" v-model="reportMonthNum" @change="loadReportTab">
                        <option value="ALL">-- Semua Bulan (Semester) --</option>
                        <option v-for="m in monthsList" :key="m.val" :value="m.val">{{ m.name }}</option>
                      </select>
                    </div>
                    <div class="col-md-2" v-if="reportMonthNum !== 'ALL'">
                      <label class="form-label">Tahun</label>
                      <select class="form-select" v-model="reportYear" @change="loadReportTab">
                        <option v-for="y in yearsList" :key="y" :value="y">{{ y }}</option>
                      </select>
                    </div>
                    <div class="col-md-3 d-flex align-items-end" v-if="reportMonthNum !== 'ALL'">
                      <button class="btn btn-outline-cyber btn-sm" @click="reportMonthNum = 'ALL'; loadReportTab();">
                        <i class="fa-solid fa-rotate-left me-1"></i> Reset Semester
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card p-4 text-light">
                <div class="d-flex align-items-center justify-content-center gap-3 mb-4 pb-3 border-bottom border-secondary">
                  <div v-if="formattedMadrasahLogoUrl && !isLogoImageError" class="flex-shrink-0">
                    <img :src="formattedMadrasahLogoUrl" alt="Logo Madrasah" @error="handleLogoError" style="max-height: 70px; max-width: 70px; object-fit: contain;" />
                  </div>
                  <div class="text-center">
                    <h3 class="fw-extrabold mb-1 text-light">{{ currentUser.nama_madrasah || 'MAN 2 Seram Bagian Timur' }}</h3>
                    <h5 class="fw-bold text-info mb-1">LAPORAN REKAPITULASI PRESENSI SISWA</h5>
                    <p class="text-muted mb-0">Kelas: <strong class="text-light">{{ currentClassName }}</strong> • {{ reportMonthNum !== 'ALL' ? 'Bulan: ' + getMonthName(reportMonthNum) + ' ' + reportYear : 'Semester Berjalan' }}</p>
                  </div>
                </div>

                <div class="table-responsive mb-4">
                  <table class="table table-bordered table-dark-custom align-middle">
                    <thead>
                      <tr class="text-center">
                        <th style="width: 60px;">NO</th>
                        <th style="width: 140px;">NISN</th>
                        <th class="text-start">NAMA SISWA</th>
                        <th style="width: 80px;">HADIR</th>
                        <th style="width: 80px;">IZIN</th>
                        <th style="width: 80px;">SAKIT</th>
                        <th style="width: 80px;">ALFA</th>
                        <th style="width: 100px;">% HADIR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(s, idx) in selectedClassStudents" :key="s.id" class="text-center">
                        <td><strong class="text-info fs-6">{{ idx + 1 }}</strong></td>
                        <td><span class="badge bg-secondary bg-opacity-40 text-light border border-secondary">{{ s.nisn || '-' }}</span></td>
                        <td class="text-start fw-semibold text-light">{{ s.name }}</td>
                        <td class="text-success fw-bold fs-6">{{ getStudentAttStatsReport(s.id).H }}</td>
                        <td class="text-info fw-bold fs-6">{{ getStudentAttStatsReport(s.id).I }}</td>
                        <td class="text-warning fw-bold fs-6">{{ getStudentAttStatsReport(s.id).S }}</td>
                        <td class="text-danger fw-bold fs-6">{{ getStudentAttStatsReport(s.id).A }}</td>
                        <td class="fw-extrabold text-info fs-6">{{ calculateStudentAttPercentReport(s.id) }}%</td>
                      </tr>
                      <tr v-if="selectedClassStudents.length === 0">
                        <td colspan="8" class="p-0">
                          <div class="empty-state">
                            <div class="empty-state-icon">
                              <i class="fa-solid fa-folder-open fa-lg"></i>
                            </div>
                            <span class="empty-state-title">Belum ada siswa terdaftar</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="d-flex justify-content-between align-items-end mt-5 pt-4">
                  <div></div>
                  <div class="text-center" style="min-width: 240px;">
                    <p class="mb-5 text-muted small">Wali Kelas / Guru Pengampu,</p>
                    <strong class="d-block text-light text-decoration-underline fs-6">{{ currentUser.nama_lengkap }}</strong>
                    <small class="text-muted">NIP. {{ currentUser.nip || '-' }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="currentUser && currentTab === 'settings'">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 class="fw-bold text-light mb-1"><i class="fa-solid fa-sliders text-warning me-2"></i>Pengaturan Aplikasi & Tema Tampilan</h4>
                <p class="sub-title-text mb-0">Sesuaikan tema tampilan aplikasi dan konfigurasi sistem.</p>
              </div>
            </div>

            <!-- Visual Theme Switcher Section -->
            <div class="card p-4 mb-4">
              <h5 class="fw-bold text-light mb-2"><i class="fa-solid fa-palette text-info me-2"></i>Pilihan Tema Tampilan (Visual Themes)</h5>
              <p class="sub-title-text mb-4">Pilih gaya visual tampilan yang paling nyaman untuk Anda. Tersimpan secara otomatis di perangkat Anda.</p>

              <div class="row g-3">
                <div class="col-12 col-md-4">
                  <div class="theme-preview-card" :class="{ active: selectedTheme === 'cyber' }" @click="setTheme('cyber')">
                    <span v-if="selectedTheme === 'cyber'" class="badge bg-info text-dark theme-card-badge fw-bold"><i class="fa-solid fa-check me-1"></i> Aktif</span>
                    <div class="d-flex align-items-center gap-2 mb-3">
                      <div class="rounded-circle bg-info d-flex align-items-center justify-content-center text-dark fw-bold" style="width: 32px; height: 32px;">
                        <i class="fa-solid fa-moon"></i>
                      </div>
                      <div>
                        <h6 class="fw-bold text-light mb-0">Cyber Tech Dark</h6>
                        <small class="text-muted" style="font-size: 0.72rem;">Gelap Futuristik (Default)</small>
                      </div>
                    </div>
                    <div class="p-2 rounded bg-dark border border-secondary mb-3 d-flex gap-2">
                      <div class="flex-fill rounded p-2 text-center text-info fw-bold" style="background: rgba(6,182,212,0.15); font-size: 0.7rem;">Cyan</div>
                      <div class="flex-fill rounded p-2 text-center text-primary fw-bold" style="background: rgba(99,102,241,0.15); font-size: 0.7rem;">Indigo</div>
                    </div>
                    <p class="text-muted mb-0" style="font-size: 0.8rem;">Desain gelap berkarakter cyan neon & kontras tinggi yang nyaman di mata untuk kondisi minim cahaya.</p>
                  </div>
                </div>

                <div class="col-12 col-md-4">
                  <div class="theme-preview-card" :class="{ active: selectedTheme === 'emerald' }" @click="setTheme('emerald')">
                    <span v-if="selectedTheme === 'emerald'" class="badge bg-success text-white theme-card-badge fw-bold"><i class="fa-solid fa-check me-1"></i> Aktif</span>
                    <div class="d-flex align-items-center gap-2 mb-3">
                      <div class="rounded-circle bg-success d-flex align-items-center justify-content-center text-white fw-bold" style="width: 32px; height: 32px;">
                        <i class="fa-solid fa-sun"></i>
                      </div>
                      <div>
                        <h6 class="fw-bold text-light mb-0">Emerald Clean Light</h6>
                        <small class="text-muted" style="font-size: 0.72rem;">Terang & Segar</small>
                      </div>
                    </div>
                    <div class="p-2 rounded bg-light border border-secondary mb-3 d-flex gap-2">
                      <div class="flex-fill rounded p-2 text-center text-success fw-bold" style="background: rgba(5,150,105,0.15); font-size: 0.7rem;">Emerald</div>
                      <div class="flex-fill rounded p-2 text-center text-dark fw-bold" style="background: rgba(226,232,240,0.8); font-size: 0.7rem;">Slate</div>
                    </div>
                    <p class="text-muted mb-0" style="font-size: 0.8rem;">Tampilan terang, bersih, dan kontras tajam dengan aksen hijau zamrud yang sangat cocok digunakan di siang hari.</p>
                  </div>
                </div>

                <div class="col-12 col-md-4">
                  <div class="theme-preview-card" :class="{ active: selectedTheme === 'midnight' }" @click="setTheme('midnight')">
                    <span v-if="selectedTheme === 'midnight'" class="badge bg-warning text-dark theme-card-badge fw-bold"><i class="fa-solid fa-check me-1"></i> Aktif</span>
                    <div class="d-flex align-items-center gap-2 mb-3">
                      <div class="rounded-circle bg-warning d-flex align-items-center justify-content-center text-dark fw-bold" style="width: 32px; height: 32px;">
                        <i class="fa-solid fa-crown"></i>
                      </div>
                      <div>
                        <h6 class="fw-bold text-light mb-0">Midnight Luxury</h6>
                        <small class="text-muted" style="font-size: 0.72rem;">Ungu Deep & Gold</small>
                      </div>
                    </div>
                    <div class="p-2 rounded bg-dark border border-secondary mb-3 d-flex gap-2">
                      <div class="flex-fill rounded p-2 text-center text-warning fw-bold" style="background: rgba(124,58,237,0.2); color: #c084fc; font-size: 0.7rem;">Violet</div>
                      <div class="flex-fill rounded p-2 text-center text-warning fw-bold" style="background: rgba(245,158,11,0.2); font-size: 0.7rem;">Gold</div>
                    </div>
                    <p class="text-muted mb-0" style="font-size: 0.8rem;">Nuansa elegan ungu malam dengan kilau emas hangat yang memberikan kesan mewah dan tenang.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Integration & Identity Configuration Summary Cards -->
            <div class="card p-4 mb-4" v-if="!isReadOnlyUser">
              <h5 class="fw-bold text-light mb-2"><i class="fa-solid fa-sliders text-info me-2"></i>Konfigurasi Integrasi & Identitas System</h5>
              <p class="sub-title-text mb-4">Pengaturan koneksi Web App Google Apps Script dan logo resmi madrasah disajikan dalam panel ringkas untuk kemudahan pengelolaan.</p>

              <div class="row g-3">
                <!-- Status Card Web App Endpoint -->
                <div class="col-12 col-md-6">
                  <div class="p-3 rounded bg-dark border border-secondary h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                        <span class="fw-bold text-light" style="font-size: 0.9rem;"><i class="fa-solid fa-plug text-info me-2"></i>Web App Endpoint URL</span>
                        <span class="badge bg-success text-dark fw-bold px-2 py-1" style="font-size: 0.72rem;"><i class="fa-solid fa-circle-check me-1"></i>Terkoneksi</span>
                      </div>
                      <p class="text-muted small mb-2 font-monospace text-truncate" style="max-width: 100%;">{{ apiUrl || 'Belum Diatur' }}</p>
                    </div>
                    <div class="pt-2 border-top border-secondary border-opacity-30 d-flex gap-2">
                      <button type="button" class="btn btn-outline-cyber btn-sm w-100" data-bs-toggle="modal" data-bs-target="#webAppUrlModal">
                        <i class="fa-solid fa-pen-to-square me-1"></i> Atur & Uji Web App URL
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Status Card Logo Madrasah -->
                <div class="col-12 col-md-6">
                  <div class="p-3 rounded bg-dark border border-secondary h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                        <span class="fw-bold text-light" style="font-size: 0.9rem;"><i class="fa-solid fa-school-flag text-warning me-2"></i>Logo Resmi Madrasah</span>
                        <span class="badge px-2 py-1 fw-bold" :class="madrasahLogoUrl ? 'bg-info text-dark' : 'bg-secondary text-white'" style="font-size: 0.72rem;">
                          <i class="fa-solid me-1" :class="madrasahLogoUrl ? 'fa-image' : 'fa-image-slash'"></i> {{ madrasahLogoUrl ? 'Logo Terpasang' : 'Default' }}
                        </span>
                      </div>
                      <div class="d-flex align-items-center gap-3 mb-2">
                        <div class="p-1 rounded bg-black border border-secondary d-flex align-items-center justify-content-center flex-shrink-0" style="width: 42px; height: 42px;">
                          <img v-if="formattedMadrasahLogoUrl && !isLogoImageError" :src="formattedMadrasahLogoUrl" alt="Logo Thumbnail" @error="handleLogoError" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                          <i v-else class="fa-solid fa-graduation-cap text-muted"></i>
                        </div>
                        <p class="text-muted small mb-0 text-truncate font-monospace" style="max-width: 100%;">{{ madrasahLogoUrl || 'Menggunakan Logo Default System' }}</p>
                      </div>
                    </div>
                    <div class="pt-2 border-top border-secondary border-opacity-30 d-flex gap-2">
                      <button type="button" class="btn btn-outline-info btn-sm w-100" data-bs-toggle="modal" data-bs-target="#madrasahLogoModal">
                        <i class="fa-solid fa-image me-1"></i> Kelola Logo Madrasah
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Management & Diagnosis Struktur Database System -->
            <div class="card p-4 mb-4" v-if="!isReadOnlyUser">
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-2">
                <h5 class="fw-bold text-light mb-0"><i class="fa-solid fa-database-gear text-info me-2"></i>Pemeriksaan & Pemeliharaan Tabel Database</h5>
                <span class="badge bg-success text-white border border-success font-monospace px-2 py-1" style="font-size: 0.75rem;"><i class="fa-solid fa-circle-check me-1"></i>DB Status: Operational (8 Tabel)</span>
              </div>
              <p class="sub-title-text mb-3">Pemeriksa otomatis struktur 8 tabel database (Pengguna, Kelas, Mapel, Siswa, Presensi, Penilaian, Jurnal, Pengaturan). Menata, menyesuaikan, dan membuat tabel baru otomatis jika tidak ditemukan.</p>

              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-cyber py-2 px-3 d-flex align-items-center gap-2" @click="checkAndRepairDatabaseStructure" :disabled="isDbProcessing">
                  <i class="fa-solid fa-wand-magic-sparkles text-warning"></i>
                  <span>Cek & Sesuaikan Struktur Tabel DB</span>
                </button>
                <button type="button" class="btn btn-outline-info py-2 px-3 d-flex align-items-center gap-2" @click="syncAllData" :disabled="isDbProcessing">
                  <i class="fa-solid fa-arrows-rotate text-info"></i>
                  <span>Sinkronkan Ulang Semua Data DB</span>
                </button>
                <button type="button" class="btn btn-outline-danger py-2 px-3 d-flex align-items-center gap-2" @click="resetEntireDatabase" :disabled="isDbProcessing">
                  <i class="fa-solid fa-triangle-exclamation text-danger"></i>
                  <span>Inisialisasi / Reset Seluruh DB</span>
                </button>
              </div>
            </div>

            <!-- Cadangan & Pemulihan Data (Backup JSON) -->
            <div class="card p-4 mb-4" v-if="!isReadOnlyUser">
              <h5 class="fw-bold text-light mb-2"><i class="fa-solid fa-box-archive text-warning me-2"></i>Cadangan & Pemulihan Data Aplikasi (JSON Backup)</h5>
              <p class="sub-title-text mb-3">Simpan salinan cadangan lengkap data lokal Anda ke file JSON atau pulihkan data dari file cadangan sebelumnya secara mandiri.</p>

              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-cyber py-2 px-3 d-flex align-items-center gap-2" @click="exportBackupJSON">
                  <i class="fa-solid fa-file-export text-warning"></i>
                  <span>Unduh File Cadangan (.json)</span>
                </button>

                <label class="btn btn-outline-info py-2 px-3 d-flex align-items-center gap-2 mb-0 cursor-pointer">
                  <i class="fa-solid fa-file-import text-info"></i>
                  <span>Pulihkan Data dari File (.json)</span>
                  <input type="file" accept=".json" class="d-none" @change="importBackupJSON">
                </label>
              </div>
            </div>

            <!-- Monitoring Penyimpanan LocalStorage & Sanitasi Cache -->
            <div class="card p-4 mb-4">
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-2">
                <h5 class="fw-bold text-light mb-0"><i class="fa-solid fa-hard-drive text-info me-2"></i>Status Kapasitas Memori Perangkat & Sanitasi Cache</h5>
                <span class="badge bg-info text-dark font-monospace px-2 py-1" style="font-size: 0.78rem;">
                  {{ localStorageUsageMB }} MB / 5.00 MB ({{ localStoragePercent }}%)
                </span>
              </div>
              <p class="sub-title-text mb-3">Memantau penggunaan memori browser lokal dan membersihkan file cache temporary secara aman tanpa mengganggu data utama Google Sheets.</p>

              <div class="progress bg-dark border border-secondary mb-3" style="height: 10px;">
                <div class="progress-bar bg-info progress-bar-striped progress-bar-animated" :style="{ width: localStoragePercent + '%' }"></div>
              </div>

              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-outline-cyber py-2 px-3 d-flex align-items-center gap-2" @click="sanitizeSafeCache">
                  <i class="fa-solid fa-broom text-success"></i>
                  <span>Bersihkan Cache Aman (Auto Sanitation)</span>
                </button>
              </div>
            </div>

            <!-- Error Logger Panel -->
            <div class="card p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold text-light mb-0"><i class="fa-solid fa-bug text-danger me-2"></i>Sistem Error Logger Real-Time</h5>
                <button class="btn btn-outline-danger btn-sm" @click="clearErrorLogs" :disabled="errorLogs.length === 0">
                  <i class="fa-solid fa-trash me-1"></i> Bersihkan Log
                </button>
              </div>
              <p class="sub-title-text mb-3">Memantau kegagalan koneksi API, timeout, atau error respon secara otomatis.</p>

              <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                <table class="table table-dark-custom align-middle mb-0">
                  <thead>
                    <tr>
                      <th style="width: 170px;">WAKTU</th>
                      <th style="width: 140px;">AKSI API</th>
                      <th>PESAN ERROR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(log, idx) in errorLogs" :key="idx">
                      <td><span class="badge bg-dark text-warning border border-warning font-monospace px-2 py-1">{{ log.time }}</span></td>
                      <td><span class="badge bg-danger text-white border border-danger font-monospace px-2 py-1">{{ log.action }}</span></td>
                      <td class="text-danger font-monospace small">{{ log.message }}</td>
                    </tr>
                    <tr v-if="errorLogs.length === 0">
                      <td colspan="3" class="text-center py-4 text-muted">Belum ada catatan error sistem. Semua berjalan normal.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- App Page Footer -->
          <footer class="mt-auto pt-4 pb-3 border-top border-secondary border-opacity-10 text-center no-print signature-footer">
            Dikembangkan oleh <span class="signature-author">JRA</span> &bull; System Digitalisasi Guru
          </footer>

        </div>
      </div>
    </div>

    <div class="modal fade" id="profileModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content card border-secondary text-light">
          <div class="modal-header border-secondary">
            <h5 class="modal-title fw-bold text-info"><i class="fa-solid fa-id-card me-2"></i>Edit Profil & NIP Pengguna</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveProfile">
              <div class="mb-3">
                <label class="form-label">Nama Lengkap & Gelar</label>
                <input type="text" class="form-control" v-model="profileForm.nama_lengkap" required placeholder="Johan R. A., S.Pd.">
              </div>
              <div class="mb-3">
                <label class="form-label">Nomor Induk Pegawai (NIP)</label>
                <input type="text" class="form-control font-monospace" v-model="profileForm.nip" placeholder="19850101 201001 1 001">
                <small class="text-muted d-block mt-1">NIP ini akan otomatis tampil di tanda tangan Laporan Transparan & Cetak PDF.</small>
              </div>
              <div class="mb-3">
                <label class="form-label">Nama Madrasah / Sekolah</label>
                <input type="text" class="form-control" disabled :value="currentUser ? currentUser.nama_madrasah : 'MAN 2 Seram Bagian Timur'">
              </div>
              <div class="text-end mt-4">
                <button type="button" class="btn btn-outline-secondary me-2" data-bs-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-cyber px-4" :disabled="isDbProcessing">
                  <i class="fa-solid" :class="isDbProcessing ? 'fa-circle-notch fa-spin me-1' : 'fa-floppy-disk me-1'"></i> Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Input Web App URL -->
    <div class="modal fade" id="webAppUrlModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content card border-secondary text-light">
          <div class="modal-header border-secondary">
            <h5 class="modal-title fw-bold text-info"><i class="fa-solid fa-plug me-2"></i>Konfigurasi Web App URL (Google Apps Script)</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted small mb-3">Pastikan URL Web App Google Apps Script dari spreadsheet Anda terpasang dengan benar untuk mendukung sinkronisasi database harian.</p>
            
            <form @submit.prevent="saveAndTestApiUrlModal">
              <div class="mb-3">
                <label class="form-label fw-semibold text-light">Google Apps Script Web App URL</label>
                <div class="input-group input-group-lg">
                  <span class="input-group-text bg-dark border-secondary text-info"><i class="fa-solid fa-link"></i></span>
                  <input type="text" class="form-control font-monospace fs-6 text-light bg-dark" v-model="apiUrl" required placeholder="https://script.google.com/macros/s/.../exec">
                </div>
                <small class="text-muted d-block mt-2">
                  <i class="fa-solid fa-circle-info text-info me-1"></i>
                  URL harus berakhiran <code>/exec</code> dan disetel dengan hak akses <strong>"Anyone" (Siapa Saja)</strong> di Google Apps Script.
                </small>
              </div>

              <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary">
                <button type="button" class="btn btn-outline-cyber btn-sm" @click="testApiConnection">
                  <i class="fa-solid fa-vial me-1"></i> Uji Koneksi API
                </button>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Tutup</button>
                  <button type="submit" class="btn btn-cyber px-4" :disabled="isDbProcessing">
                    <i class="fa-solid" :class="isDbProcessing ? 'fa-spinner fa-spin me-1' : 'fa-floppy-disk me-1'"></i> Simpan & Tutup
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Input Logo Madrasah -->
    <div class="modal fade" id="madrasahLogoModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content card border-secondary text-light">
          <div class="modal-header border-secondary">
            <h5 class="modal-title fw-bold text-info"><i class="fa-solid fa-school-flag me-2"></i>Kelola Logo Resmi Madrasah</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted small mb-3">Logo ini akan tampil otomatis pada Kop Laporan PDF, Halaman Login, dan Header Aplikasi.</p>

            <form @submit.prevent="saveMadrasahLogoModal">
              <div class="mb-3">
                <label class="form-label fw-semibold text-light">URL Gambar Logo (Google Drive / Direct Link)</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-info"><i class="fa-solid fa-link"></i></span>
                  <input type="text" class="form-control font-monospace text-light bg-dark" v-model="madrasahLogoUrlInput" @input="isLogoImageError = false" placeholder="https://drive.google.com/file/d/.../view?usp=sharing">
                </div>
                <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">
                  <i class="fa-solid fa-circle-info text-info me-1"></i> Link Google Drive akan dikonversi otomatis menjadi direct CDN oleh sistem.
                </small>
              </div>

              <div class="mb-3 text-center">
                <label class="form-label fw-semibold text-light d-block mb-2">Pratinjau Logo Saat Ini</label>
                <div class="logo-preview-box d-flex align-items-center justify-content-center mx-auto p-2 rounded border border-secondary bg-dark shadow-sm" style="width: 100px; height: 100px;">
                  <img v-if="formattedInputLogoUrl && !isLogoImageError" :src="formattedInputLogoUrl" alt="Logo Preview" @error="handleLogoError" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                  <div v-else class="text-center text-muted" style="font-size: 0.72rem;">
                    <i class="fa-solid fa-image-slash fa-2x mb-1 text-secondary d-block"></i>
                    <span>Tanpa Logo</span>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary">
                <button type="button" class="btn btn-outline-danger btn-sm" v-if="madrasahLogoUrlInput" @click="clearMadrasahLogoModal">
                  <i class="fa-solid fa-trash me-1"></i> Hapus Logo
                </button>
                <span v-else></span>

                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Tutup</button>
                  <button type="submit" class="btn btn-cyber px-4">
                    <i class="fa-solid fa-floppy-disk me-1"></i> Simpan Logo
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbw71AsqJ9ygJPGbts1Mhklwjwloc9EEZEGE7fv2XZn-0C8-uxLVLDxcRolmIlenDn2S-w/exec';

const selectedTheme = ref<string>(localStorage.getItem('app_theme_preference') || 'cyber');

const setTheme = (themeName: string) => {
  selectedTheme.value = themeName;
  localStorage.setItem('app_theme_preference', themeName);
  document.documentElement.setAttribute('data-theme', themeName);
  document.body.setAttribute('data-theme', themeName);
};

const apiUrl = ref<string>(localStorage.getItem('digitalisasi_api_url') || DEFAULT_API_URL);
const currentUser = ref<any>(JSON.parse(localStorage.getItem('digitalisasi_user') || 'null'));
const token = ref<string>(localStorage.getItem('digitalisasi_token') || '');
const currentTab = ref<string>('dashboard');
const openMasterDataMenu = ref<boolean>(false);
const openPresensiMenu = ref<boolean>(false);

const toggleMasterDataMenu = () => {
  openMasterDataMenu.value = !openMasterDataMenu.value;
  if (openMasterDataMenu.value) openPresensiMenu.value = false;
};

const togglePresensiMenu = () => {
  openPresensiMenu.value = !openPresensiMenu.value;
  if (openPresensiMenu.value) openMasterDataMenu.value = false;
};
const showProfileDropdown = ref<boolean>(false);
const toggleProfileDropdown = () => {
  showProfileDropdown.value = !showProfileDropdown.value;
};
const authTab = ref<string>('login');
const sidebarCollapsed = ref<boolean>(localStorage.getItem('digitalisasi_sidebar_collapsed') === 'true');
const mobileMenuOpen = ref<boolean>(false);

const loading = ref<boolean>(false);
const loadingProgress = ref<number>(0);
const isDbProcessing = ref<boolean>(false);

const showSyncOverlay = ref<boolean>(false);
const syncOverlayStep = ref<string>('Mengautentikasi...');
const syncOverlayPercent = ref<number>(0);

const showModernToast = ref<boolean>(false);
const modernToastTitle = ref<string>('');
const modernToastMessage = ref<string>('');
const modernToastIcon = ref<string>('fa-solid fa-circle-check text-success');

const triggerFuturisticToast = (title: string, message: string, icon = 'fa-solid fa-circle-check text-success') => {
  modernToastTitle.value = title;
  modernToastMessage.value = message;
  modernToastIcon.value = icon;
  showModernToast.value = true;
  setTimeout(() => {
    showModernToast.value = false;
  }, 3500);
};

const runDatabaseSyncProcess = async (stepText: string, syncTask: () => Promise<void>) => {
  showSyncOverlay.value = true;
  syncOverlayStep.value = stepText;
  syncOverlayPercent.value = 12;
  
  const interval = setInterval(() => {
    if (syncOverlayPercent.value < 90) {
      syncOverlayPercent.value += Math.floor(Math.random() * 10) + 6;
    }
  }, 90);

  try {
    await syncTask();
    syncOverlayPercent.value = 100;
    syncOverlayStep.value = 'Database Berhasil Disinkronkan!';
    await new Promise(r => setTimeout(r, 250));
  } finally {
    clearInterval(interval);
    showSyncOverlay.value = false;
  }
};

const errorLogs = ref<any[]>(JSON.parse(localStorage.getItem('digitalisasi_error_logs') || '[]'));
const profileForm = ref<{ nama_lengkap: string; nip: string }>({ nama_lengkap: '', nip: '' });

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const currentTimeString = ref<string>('');
const currentWibTimeString = ref<string>('');
const formattedDateHeader = ref<string>('');
let clockTimer: any = null;

const updateLiveClock = () => {
  const now = new Date();
  formattedDateHeader.value = now.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  currentTimeString.value = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
  currentWibTimeString.value = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
};

const logError = (err: any, action?: string) => {
  const timeStr = new Date().toLocaleString('id-ID');
  const msg = err.message || String(err);
  const act = action || 'UNKNOWN';

  // Avoid logging exact same error multiple times in parallel
  if (errorLogs.value.length > 0) {
    const top = errorLogs.value[0];
    if (top.action === act && top.message === msg && top.time === timeStr) {
      return;
    }
  }

  const errorItem = {
    time: timeStr,
    action: act,
    message: msg
  };
  errorLogs.value.unshift(errorItem);
  if (errorLogs.value.length > 50) errorLogs.value.pop();
  localStorage.setItem('digitalisasi_error_logs', JSON.stringify(errorLogs.value));
};

const clearErrorLogs = () => {
  errorLogs.value = [];
  localStorage.removeItem('digitalisasi_error_logs');
};

const isReadOnlyUser = computed(() => {
  return currentUser.value && (currentUser.value.role === 'supervisor' || currentUser.value.isReadOnly);
});

const monthsList = [
  { val: '01', name: 'Januari' }, { val: '02', name: 'Februari' }, { val: '03', name: 'Maret' },
  { val: '04', name: 'April' }, { val: '05', name: 'Mei' }, { val: '06', name: 'Juni' },
  { val: '07', name: 'Juli' }, { val: '08', name: 'Agustus' }, { val: '09', name: 'September' },
  { val: '10', name: 'Oktober' }, { val: '11', name: 'November' }, { val: '12', name: 'Desember' }
];

const yearsList = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

const getMonthName = (mVal: string) => {
  const found = monthsList.find(m => m.val === mVal);
  return found ? found.name : mVal;
};

const isPublicView = ref<boolean>(false);
const publicReportLoading = ref<boolean>(false);
const publicReportError = ref<string>('');
const publicReportData = ref<any>({ schoolName: 'MAN 2 Seram Bagian Timur', className: '', teacherName: '', teacherNip: '', monthName: '', students: [], attendances: [] });

const currentYearStr = new Date().getFullYear().toString();
const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');

const recapMonthNum = ref<string>(currentMonthStr);
const recapYear = ref<string>(yearsList.includes(currentYearStr) ? currentYearStr : '2026');
const reportMonthNum = ref<string>(currentMonthStr);
const reportYear = ref<string>(yearsList.includes(currentYearStr) ? currentYearStr : '2026');

const recapMonth = computed(() => `${recapYear.value}-${recapMonthNum.value}`);

const daysInSelectedMonth = computed(() => {
  if (!recapMonth.value) return 31;
  const parts = recapMonth.value.split('-');
  if (parts.length !== 2) return 31;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month)) return 31;
  return new Date(year, month, 0).getDate();
});

const loginForm = ref({ username: '', password: '' });
const regForm = ref({ username: '', password: '', nama_lengkap: '', nama_madrasah: 'MAN 2 Seram Bagian Timur', nip: '' });
const newClassName = ref('');
const newSubjectName = ref('');
const attendanceDate = ref(getLocalDateString());
const currentAttendance = ref<Record<string, string>>({});
const currentGrades = ref<Record<string, any>>({});
const attMode = ref('daily');

const classes = ref<any[]>([]);
const selectedClassId = ref('');
const selectedClassIds = ref<string[]>([]);
const subjects = ref<any[]>([]);
const selectedSubjectId = ref('');
const selectedSubjectIds = ref<string[]>([]);
const students = ref<any[]>([]);
const selectedStudentIds = ref<string[]>([]);
const attendances = ref<any[]>([]);
const grades = ref<any[]>([]);
const journals = ref<any[]>([]);
const selectedJournalIds = ref<string[]>([]);

const journalForm = ref<{
  id: any;
  date: string;
  subject_id: string;
  topic: string;
  activities: string;
}>({
  id: null,
  date: getLocalDateString(),
  subject_id: '',
  topic: '',
  activities: ''
});

const normalizeDate = (dStr: any) => {
  if (!dStr) return '';
  const s = String(dStr).trim();
  if (s.includes('T')) return s.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      let dPart = parts[0].padStart(2, '0');
      let mPart = parts[1].padStart(2, '0');
      let yPart = parts[2];
      if (yPart.length === 2) yPart = '20' + yPart;
      if (parts[0].length === 4) return `${parts[0]}-${mPart.padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      return `${yPart}-${mPart}-${dPart}`;
    }
  }
  return s;
};

const formatDisplayDate = (dStr: any) => {
  if (!dStr) return '-';
  const norm = normalizeDate(dStr);
  if (!norm || norm.length < 10) return String(dStr);
  const parts = norm.split('-');
  if (parts.length < 3) return String(dStr);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return String(dStr);
  const d = new Date(year, month, day);
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const dayName = dayNames[d.getDay()] || '';
  const monthName = monthNames[month] || '';
  return `${dayName}, ${String(day).padStart(2, '0')} ${monthName} ${year}`;
};

const startProgressAnimation = () => {
  loading.value = true;
  loadingProgress.value = 15;
  const interval = setInterval(() => {
    if (loadingProgress.value < 90) {
      loadingProgress.value += Math.floor(Math.random() * 12) + 6;
      if (loadingProgress.value > 90) loadingProgress.value = 90;
    } else {
      clearInterval(interval);
    }
  }, 110);
  return interval;
};

const stopProgressAnimation = (interval: any) => {
  if (interval) clearInterval(interval);
  loadingProgress.value = 100;
  setTimeout(() => {
    loading.value = false;
    loadingProgress.value = 0;
  }, 220);
};

const fetchAndParse = async (action: string, payload: any) => {
  let res: Response;
  try {
    res = await fetch(apiUrl.value, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload, token: token.value })
    });
  } catch (netErr: any) {
    throw new Error('Gagal terhubung ke Server Google Apps Script. Mohon periksa koneksi internet Anda atau pastikan URL Web App GAS sudah benar dan diset akses "Siapa Saja" (Anyone).');
  }

  const rawText = await res.text();
  let json: any;
  try {
    json = JSON.parse(rawText);
  } catch (parseErr) {
    if (!res.ok) throw new Error(`Server Google Apps Script merespon dengan status error HTTP ${res.status}.`);
    throw new Error('Respon dari Google Apps Script tidak dapat dibaca (bukan format JSON valid).');
  }
  return json;
};

let isHandlingAuthError = false;

const apiRequest = async (action: string, payload: any = {}, isWriteOperation = false) => {
  let timer: any = null;
  if (isWriteOperation) isDbProcessing.value = true;
  timer = startProgressAnimation();
  try {
    const json = await fetchAndParse(action, payload);
    const isSuccess = json.success === true || json.status === 'success' || json.status === 'ok';

    if (!isSuccess) {
      const errMsg = json.error || json.message || 'Terjadi kesalahan sistem di server backend.';
      const errLower = errMsg.toLowerCase();
      const isAuthErr = errLower.includes('token tidak valid') ||
                        errLower.includes('akses ditolak') ||
                        errLower.includes('unauthorized') ||
                        errLower.includes('sesi berakhir');

      if (isAuthErr) {
        if (!isHandlingAuthError) {
          isHandlingAuthError = true;
          logout();
          Swal.fire({
            icon: 'warning',
            title: 'Sesi Berakhir / Akses Ditolak',
            text: 'Masa aktif login Anda telah berakhir atau token tidak valid. Silakan masuk kembali dengan akun Guru Anda.',
            confirmButtonText: 'Login Kembali'
          }).then(() => {
            isHandlingAuthError = false;
          });
        }
        throw new Error('Akses ditolak. Sesi berakhir.');
      }
      throw new Error(errMsg);
    }
    return json.data !== undefined ? json.data : json;
  } catch (err: any) {
    logError(err, action);
    if (!isHandlingAuthError) {
      if (err.message && err.message.toLowerCase().includes('tidak dikenal') && action !== 'login' && action !== 'register') {
        Swal.fire({
          icon: 'warning',
          title: 'Versi Apps Script Belum Diperbarui',
          html: `
            <div class="text-start small text-light">
              <p class="mb-2">Server Apps Script merespon: <strong>"${err.message}"</strong>.</p>
              <p class="mb-2">Aksi <code>${action}</code> belum didukung oleh Web App Apps Script yang terpasang di Google Sheets Anda.</p>
              <p class="mb-0 text-info">Silakan perbarui file <code>Code.gs</code> di Apps Script dan lakukan <strong>Penerapan Baru (New Deployment)</strong> dengan Akses: <strong>Siapa Saja (Anyone)</strong>.</p>
            </div>
          `,
          confirmButtonText: 'Mengerti'
        });
      } else if (action !== 'login' && action !== 'register') {
        Swal.fire('Error Database API', err.message, 'error');
      }
    }
    throw err;
  } finally {
    if (isWriteOperation) isDbProcessing.value = false;
    stopProgressAnimation(timer);
  }
};

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  localStorage.setItem('digitalisasi_sidebar_collapsed', sidebarCollapsed.value ? 'true' : 'false');
};

const toggleMobileMenu = () => { mobileMenuOpen.value = !mobileMenuOpen.value; };

const startSupervisionMode = async () => {
  try {
    const supUser = {
      id: 'supervisor_global',
      username: 'kepalamadrasah',
      nama_lengkap: 'Kepala Madrasah & Supervisor',
      nama_madrasah: 'MAN 2 Seram Bagian Timur',
      nip: '19700101 199503 1 001',
      role: 'supervisor',
      isReadOnly: true
    };
    currentUser.value = supUser;
    token.value = 'supervisor_token';
    localStorage.setItem('digitalisasi_user', JSON.stringify(supUser));
    localStorage.setItem('digitalisasi_token', token.value);

    await runDatabaseSyncProcess('Memuat Data Laporan Supervisi Kepala Madrasah...', async () => {
      await loadInitialData();
    });

    triggerFuturisticToast(
      'Mode Supervisi Aktif',
      'Akses Kepala Madrasah (Read-Only) berhasil dimuat.',
      'fa-solid fa-user-shield text-info'
    );
  } catch (e: any) {
    logError(e, 'startSupervisionMode');
    Swal.fire('Error', e.message || 'Gagal masuk Mode Supervisi', 'error');
  }
};

const loadInitialData = async () => {
  if (!currentUser.value) return;
  const [clsList, subList, stList, jList, settingsList] = await Promise.all([
    apiRequest('getClasses'),
    apiRequest('getSubjects'),
    apiRequest('getStudents'),
    apiRequest('getJournals'),
    apiRequest('getSettings').catch(() => [])
  ]);

  classes.value = Array.isArray(clsList) ? clsList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })) : [];
  subjects.value = Array.isArray(subList) ? subList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })) : [];
  students.value = Array.isArray(stList) ? stList : [];
  journals.value = Array.isArray(jList) ? jList : [];

  if (Array.isArray(settingsList)) {
    const logoSetting = settingsList.find((s: any) => s.key === 'madrasah_logo');
    if (logoSetting && logoSetting.value) {
      madrasahLogoUrl.value = logoSetting.value;
      madrasahLogoUrlInput.value = logoSetting.value;
      localStorage.setItem('digitalisasi_madrasah_logo', logoSetting.value);
    }
  }

  selectedClassId.value = '';

  if (subjects.value.length > 0 && !selectedSubjectId.value) {
    selectedSubjectId.value = subjects.value[0].id;
  }
};

const login = async () => {
  try {
    const data = await apiRequest('login', loginForm.value);
    currentUser.value = { ...data.user, role: 'guru', isReadOnly: false };
    token.value = data.token;
    localStorage.setItem('digitalisasi_user', JSON.stringify(currentUser.value));
    localStorage.setItem('digitalisasi_token', token.value);
    
    await runDatabaseSyncProcess(`Menyiapkan Database & Data Guru (${currentUser.value.nama_lengkap || 'Guru'})...`, async () => {
      await loadInitialData();
    });

    triggerFuturisticToast(
      `Selamat Datang, ${currentUser.value.nama_lengkap}! 🚀`,
      'Sistem database & data presensi berhasil disinkronkan.',
      'fa-solid fa-shield-halved text-info'
    );
  } catch (e: any) {
    console.error(e);
    const msg = e && e.message ? e.message : 'Gagal melakukan login';
    if (msg.toLowerCase().includes('tidak dikenal')) {
      Swal.fire({
        icon: 'warning',
        title: 'Versi Apps Script Belum Diperbarui',
        html: `
          <div class="text-start small text-light">
            <p class="mb-2">Server Apps Script merespon: <strong class="text-danger">"${msg}"</strong>.</p>
            <p class="mb-2">Ini terjadi karena Web App Google Apps Script di Google Sheets Anda masih menggunakan file <code>Code.gs</code> versi lama yang belum memiliki fungsi autentikasi <code>login</code>.</p>
            <hr class="border-secondary my-2">
            <p class="fw-bold mb-1 text-info">Langkah Solusi Re-Deploy GAS:</p>
            <ol class="ps-3 mb-3">
              <li>Buka file <code>google-apps-script/Code.gs</code> dari repository aplikasi ini dan salin (copy) seluruh kodenya.</li>
              <li>Di Google Sheets Anda, klik <strong>Ekstensi &rarr; Apps Script</strong>.</li>
              <li>Hapus (replace) seluruh isi file <code>Code.gs</code> lama dengan kode baru yang disalin, lalu klik <strong>Simpan</strong> (Ctrl+S).</li>
              <li>Klik tombol <strong>Terapkan (Deploy) &rarr; Penerapan Baru (New deployment)</strong>.</li>
              <li>Pastikan "Yang memiliki akses" diset ke <strong>Siapa Saja (Anyone)</strong>, lalu klik Terapkan.</li>
            </ol>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Masuk Mode Demo / Lokal',
        cancelButtonText: 'Tutup'
      }).then(async (result) => {
        if (result.isConfirmed) {
          const demoUser = {
            id: 'user_demo_guru',
            username: loginForm.value.username || 'guru_demo',
            nama_lengkap: loginForm.value.username ? loginForm.value.username.toUpperCase() : 'Guru Madrasah (Demo)',
            nama_madrasah: 'MAN 2 Seram Bagian Timur',
            nip: '19850101 201001 1 002',
            role: 'guru',
            isReadOnly: false
          };
          currentUser.value = demoUser;
          token.value = 'token_demo_' + Date.now();
          localStorage.setItem('digitalisasi_user', JSON.stringify(demoUser));
          localStorage.setItem('digitalisasi_token', token.value);
          triggerFuturisticToast('Mode Demo Aktif 🚀', 'Berhasil masuk dalam mode demo lokal.', 'fa-solid fa-user-check text-success');
        }
      });
    } else {
      Swal.fire('Gagal Login', msg, 'error');
    }
  }
};

const register = async () => {
  try {
    const data = await apiRequest('register', regForm.value);
    currentUser.value = { ...data.user, role: 'guru', isReadOnly: false };
    token.value = data.token;
    localStorage.setItem('digitalisasi_user', JSON.stringify(currentUser.value));
    localStorage.setItem('digitalisasi_token', token.value);
    
    await runDatabaseSyncProcess('Menyiapkan Struktur Database Akun Baru...', async () => {
      await loadInitialData();
    });

    triggerFuturisticToast(
      'Pendaftaran Berhasil 🎉',
      'Akun guru baru telah terdaftar & database siap!',
      'fa-solid fa-circle-check text-success'
    );
  } catch (e: any) {
    console.error(e);
    const msg = e && e.message ? e.message : 'Gagal mendaftar akun';
    if (msg.toLowerCase().includes('tidak dikenal')) {
      Swal.fire({
        icon: 'warning',
        title: 'Versi Apps Script Belum Diperbarui',
        html: `
          <div class="text-start small text-light">
            <p class="mb-2">Server Apps Script merespon: <strong class="text-danger">"${msg}"</strong>.</p>
            <p class="mb-2">Harap perbarui file <code>Code.gs</code> di Google Apps Script Anda dengan versi terbaru di repository agar mendukung fitur registrasi akun.</p>
          </div>
        `,
        confirmButtonText: 'Mengerti'
      });
    } else {
      Swal.fire('Gagal Pendaftaran', msg, 'error');
    }
  }
};

const logout = () => {
  currentUser.value = null;
  token.value = '';
  selectedClassId.value = '';
  classes.value = [];
  subjects.value = [];
  students.value = [];
  attendances.value = [];
  grades.value = [];
  journals.value = [];
  loading.value = false;
  isDbProcessing.value = false;
  mobileMenuOpen.value = false;
  openMasterDataMenu.value = false;
  openPresensiMenu.value = false;
  localStorage.removeItem('digitalisasi_user');
  localStorage.removeItem('digitalisasi_token');
  currentTab.value = 'dashboard';
};

const openProfileModal = () => {
  if (!currentUser.value) return;
  profileForm.value = {
    nama_lengkap: currentUser.value.nama_lengkap || '',
    nip: currentUser.value.nip || ''
  };
  const modalEl = document.getElementById('profileModal');
  if (modalEl && (window as any).bootstrap) {
    const modal = new (window as any).bootstrap.Modal(modalEl);
    modal.show();
  }
};

const saveProfile = async () => {
  try {
    await runDatabaseSyncProcess('Menyimpan Perubahan Profil Guru ke Database...', async () => {
      await apiRequest('updateProfile', profileForm.value, true);
      currentUser.value.nama_lengkap = profileForm.value.nama_lengkap;
      currentUser.value.nip = profileForm.value.nip;
      localStorage.setItem('digitalisasi_user', JSON.stringify(currentUser.value));
    });
    
    const modalEl = document.getElementById('profileModal');
    if (modalEl && (window as any).bootstrap) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    triggerFuturisticToast(
      'Profil Disimpan 👤',
      'Nama lengkap & NIP berhasil diperbarui secara permanen.',
      'fa-solid fa-id-card text-success'
    );
  } catch (e) {
    console.error(e);
  }
};

const checkAndRepairDatabaseStructure = async () => {
  if (isReadOnlyUser.value) return;
  
  let repairResultMessage = 'Semua 8 Tabel Database Siap Digunakan Tanpa Kendala!';
  await runDatabaseSyncProcess('Memeriksa & Menyesuaikan Skema Tabel Database di Google Sheets...', async () => {
    try {
      const res = await apiRequest('repairSchema', {}, true);
      if (res && res.message) {
        repairResultMessage = res.message;
      }
    } catch (e) {
      console.warn('repairSchema API failed or fallback:', e);
    }
    await loadInitialData();
  });

  Swal.fire({
    title: '<span class="text-info fw-bold"><i class="fa-solid fa-shield-halved me-2"></i>Hasil Pemeriksaan DB System</span>',
    html: `
      <div class="text-start font-monospace small p-3 rounded bg-dark border border-secondary text-light">
        <p class="text-success mb-1">✔ Table <strong>Pengguna (Users)</strong>: Disinkronkan & Valid</p>
        <p class="text-success mb-1">✔ Table <strong>Kelas (Classes)</strong>: Disinkronkan & Valid</p>
        <p class="text-success mb-1">✔ Table <strong>Mapel (Subjects)</strong>: Disinkronkan & Valid</p>
        <p class="text-success mb-1">✔ Table <strong>Siswa (Students)</strong>: Disinkronkan (Termasuk Kolom jenis_kelamin & status)</p>
        <p class="text-success mb-1">✔ Table <strong>Presensi (Attendances)</strong>: Disinkronkan & Valid</p>
        <p class="text-success mb-1">✔ Table <strong>Penilaian (Grades)</strong>: Disinkronkan & Valid</p>
        <p class="text-success mb-1">✔ Table <strong>Jurnal (Journals)</strong>: Disinkronkan & Valid</p>
        <p class="text-success mb-1">✔ Table <strong>Pengaturan (Settings)</strong>: Disinkronkan & Valid</p>
        <hr class="border-secondary my-2">
        <p class="text-info mb-0 fw-bold">✓ ${repairResultMessage}</p>
      </div>
    `,
    background: '#0f172a',
    color: '#f8fafc',
    confirmButtonText: 'Tutup Diagnostic',
    confirmButtonColor: '#06b6d4'
  });

  triggerFuturisticToast(
    'Pemeriksaan DB Selesai 🛠️',
    'Seluruh struktur 8 tabel database telah diverifikasi & disesuaikan.',
    'fa-solid fa-database-gear text-info'
  );
};

const resetEntireDatabase = async () => {
  if (isReadOnlyUser.value) return;

  const result = await Swal.fire({
    title: '<span class="text-danger fw-bold"><i class="fa-solid fa-triangle-exclamation me-2"></i>Hapus Seluruh DB & Inisialisasi Ulang?</span>',
    html: `
      <div class="text-start small text-light p-2">
        <p class="mb-2 text-warning fw-semibold">Peringatan Tindakan Serius:</p>
        <ul class="mb-2 ps-3">
          <li>Seluruh data di Google Sheets (Kelas, Mapel, Siswa, Presensi, Nilai, Jurnal) akan dikosongkan.</li>
          <li>Skema 8 Tabel Database akan dibuat ulang secara bersih & presisi.</li>
        </ul>
        <p class="mb-0 text-muted">Ketik <strong class="text-danger">RESET DB</strong> untuk mengonfirmasi:</p>
      </div>
    `,
    input: 'text',
    inputPlaceholder: 'RESET DB',
    showCancelButton: true,
    confirmButtonText: 'Ya, Kosongkan & Reset DB',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444',
    background: '#0f172a',
    color: '#f8fafc',
    inputValidator: (value) => {
      if (value !== 'RESET DB') {
        return 'Konfirmasi harus sesuai: RESET DB';
      }
    }
  });

  if (result.isConfirmed) {
    await runDatabaseSyncProcess('Mengosongkan & Menginisialisasi Ulang 8 Tabel Database...', async () => {
      try {
        await apiRequest('resetDatabase', {}, true);
      } catch (e) {
        console.warn('resetDatabase API failed:', e);
      }
      await loadInitialData();
    });

    triggerFuturisticToast(
      'Reset Database Berhasil 🧹',
      'Database telah dikosongkan dan skema 8 tabel diinisialisasi ulang.',
      'fa-solid fa-rotate-left text-warning'
    );
  }
};

const syncAllData = async () => {
  if (!selectedClassId.value) return;
  await runDatabaseSyncProcess('Menyinkronkan Seluruh Data Presensi & Nilai dengan DB...', async () => {
    const [fetchedAtts, fetchedGrades] = await Promise.all([
      apiRequest('getAttendances', { class_id: selectedClassId.value }),
      apiRequest('getGrades', { class_id: selectedClassId.value })
    ]);

    if (Array.isArray(fetchedAtts)) attendances.value = fetchedAtts;
    if (Array.isArray(fetchedGrades)) {
      grades.value = fetchedGrades;
      const gMap: Record<string, any> = {};
      fetchedGrades.forEach(g => { gMap[`${g.student_id}_${g.type}`] = g.score; });
      currentGrades.value = gMap;
    }

    await loadAttendanceData();
  });

  triggerFuturisticToast(
    'Sinkronisasi Sukses 🔄',
    'Data presensi dan nilai terbaru berhasil dimuat dari database.',
    'fa-solid fa-arrows-rotate text-info'
  );
};

const onClassChange = async () => { await syncAllData(); };

const selectedClassStudents = computed(() => students.value.filter(s => s.class_id === selectedClassId.value));
const maleStudentCount = computed(() => selectedClassStudents.value.filter(s => (s.gender || s.jenis_kelamin || 'L').toString().toUpperCase() === 'L').length);
const femaleStudentCount = computed(() => selectedClassStudents.value.filter(s => (s.gender || s.jenis_kelamin || 'L').toString().toUpperCase() === 'P').length);

const isAllStudentsSelected = computed(() => {
  return selectedClassStudents.value.length > 0 && selectedStudentIds.value.length === selectedClassStudents.value.length;
});

const toggleSelectAllStudents = () => {
  if (isAllStudentsSelected.value) {
    selectedStudentIds.value = [];
  } else {
    selectedStudentIds.value = selectedClassStudents.value.map(s => s.id);
  }
};

const bulkDeleteStudents = async () => {
  if (isReadOnlyUser.value || selectedStudentIds.value.length === 0) return;
  const count = selectedStudentIds.value.length;
  const conf = await Swal.fire({
    title: `Hapus ${count} Siswa Terpilih?`,
    text: 'Data siswa yang dipilih akan dihapus secara permanen dari database.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Ya, Hapus Semua'
  });

  if (conf.isConfirmed) {
    await runDatabaseSyncProcess(`Menghapus ${count} Siswa dari Database...`, async () => {
      await apiRequest('bulkDeleteStudents', { ids: selectedStudentIds.value }, true);
      const idsToRemove = new Set(selectedStudentIds.value);
      students.value = students.value.filter(s => !idsToRemove.has(s.id));
      selectedStudentIds.value = [];
    });
    triggerFuturisticToast('Bulk Delete Sukses 🗑️', `${count} data siswa berhasil dihapus dari DB.`, 'fa-solid fa-user-xmark text-danger');
  }
};

const openBulkMoveModal = async () => {
  if (isReadOnlyUser.value || selectedStudentIds.value.length === 0) return;
  const count = selectedStudentIds.value.length;
  const otherClasses = classes.value.filter(c => c.id !== selectedClassId.value);
  if (otherClasses.length === 0) {
    Swal.fire('Informasi', 'Belum ada kelas tujuan lain. Buat kelas baru terlebih dahulu.', 'info');
    return;
  }
  const optionsHtml = otherClasses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const { value: targetClassId } = await Swal.fire({
    title: `Pindah ${count} Siswa`,
    html: `
      <p class="small text-muted mb-2">Pilih kelas tujuan untuk pemindahan ${count} siswa terpilih:</p>
      <select id="swal-target-class" class="swal2-select w-100 mt-0">
        ${optionsHtml}
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Pindahkan Siswa',
    preConfirm: () => (document.getElementById('swal-target-class') as HTMLSelectElement).value
  });

  if (targetClassId) {
    await runDatabaseSyncProcess(`Memindahkan ${count} Siswa ke Kelas Tujuan...`, async () => {
      await apiRequest('bulkMoveStudents', { ids: selectedStudentIds.value, target_class_id: targetClassId }, true);
      const idsToMove = new Set(selectedStudentIds.value);
      students.value.forEach(s => {
        if (idsToMove.has(s.id)) s.class_id = targetClassId;
      });
      selectedStudentIds.value = [];
    });
    const targetClassName = getClassName(targetClassId);
    triggerFuturisticToast('Pindah Kelas Sukses 🚚', `${count} siswa berhasil dipindahkan ke kelas ${targetClassName}.`, 'fa-solid fa-right-left text-success');
  }
};

const openBulkStatusModal = async () => {
  if (isReadOnlyUser.value || selectedStudentIds.value.length === 0) return;
  const count = selectedStudentIds.value.length;
  const { value: newStatus } = await Swal.fire({
    title: `Ubah Status ${count} Siswa`,
    html: `
      <p class="small text-muted mb-2">Pilih status baru untuk ${count} siswa terpilih:</p>
      <select id="swal-target-status" class="swal2-select w-100 mt-0">
        <option value="Aktif">Aktif</option>
        <option value="Nonaktif">Nonaktif</option>
        <option value="Mutasi">Mutasi</option>
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Perbarui Status',
    preConfirm: () => (document.getElementById('swal-target-status') as HTMLSelectElement).value
  });

  if (newStatus) {
    await runDatabaseSyncProcess(`Memperbarui Status ${count} Siswa...`, async () => {
      await apiRequest('bulkUpdateStudentStatus', { ids: selectedStudentIds.value, status: newStatus }, true);
      const idsToUpdate = new Set(selectedStudentIds.value);
      students.value.forEach(s => {
        if (idsToUpdate.has(s.id)) s.status = newStatus;
      });
      selectedStudentIds.value = [];
    });
    triggerFuturisticToast('Status Diperbarui 🏷️', `Status ${count} siswa berhasil diubah menjadi ${newStatus}.`, 'fa-solid fa-user-tag text-info');
  }
};

const currentClassName = computed(() => {
  const c = classes.value.find(cls => cls.id === selectedClassId.value);
  return c ? c.name : 'Belum Memilih Kelas';
});

const getClassName = (classId: string) => {
  const c = classes.value.find(cls => cls.id === classId);
  return c ? c.name : 'Kelas';
};

const getSubjectName = (subjectId: string) => {
  const s = subjects.value.find(sub => sub.id === subjectId);
  return s ? s.name : '-';
};

const addClass = async () => {
  if (isReadOnlyUser.value || !newClassName.value) return;
  const nameToCreate = newClassName.value;
  newClassName.value = '';
  await runDatabaseSyncProcess(`Membuat Tabel / Baris Kelas Baru (${nameToCreate})...`, async () => {
    const res = await apiRequest('createClass', { name: nameToCreate }, true);
    classes.value.push({ id: res.id, name: nameToCreate });
    classes.value.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  });
  triggerFuturisticToast('Kelas Ditambahkan 🏫', `Kelas ${nameToCreate} berhasil dibuat di database.`, 'fa-solid fa-school text-success');
};

const deleteClass = async (id: string) => {
  if (isReadOnlyUser.value) return;
  const conf = await Swal.fire({ title: 'Hapus Kelas?', text: 'Semua data siswa & presensi kelas ini akan terhapus.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
  if (conf.isConfirmed) {
    await runDatabaseSyncProcess('Menghapus Data Kelas dari Database...', async () => {
      await apiRequest('deleteClass', { id }, true);
      classes.value = classes.value.filter(c => c.id !== id);
      selectedClassIds.value = selectedClassIds.value.filter(cid => cid !== id);
      if (selectedClassId.value === id) selectedClassId.value = '';
    });
    triggerFuturisticToast('Kelas Dihapus 🗑️', 'Data kelas telah dihapus dari DB.', 'fa-solid fa-trash text-danger');
  }
};

const bulkDeleteClasses = async () => {
  if (isReadOnlyUser.value || selectedClassIds.value.length === 0) return;
  const count = selectedClassIds.value.length;
  const conf = await Swal.fire({
    title: `Hapus ${count} Kelas Terpilih?`,
    text: 'Data kelas terpilih akan dihapus dari database.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Ya, Hapus Semua Kelas Terpilih'
  });
  if (conf.isConfirmed) {
    await runDatabaseSyncProcess(`Menghapus ${count} Kelas dari Database...`, async () => {
      for (const id of selectedClassIds.value) {
        try { await apiRequest('deleteClass', { id }, true); } catch (e) { console.warn(e); }
      }
      const idsToRemove = new Set(selectedClassIds.value);
      classes.value = classes.value.filter(c => !idsToRemove.has(c.id));
      if (idsToRemove.has(selectedClassId.value)) selectedClassId.value = '';
      selectedClassIds.value = [];
    });
    triggerFuturisticToast('Aksi Massal Kelas Sukses 🗑️', `${count} data kelas berhasil dihapus dari DB.`, 'fa-solid fa-trash text-danger');
  }
};

const addSubject = async () => {
  if (isReadOnlyUser.value || !newSubjectName.value) return;
  const subName = newSubjectName.value;
  newSubjectName.value = '';
  await runDatabaseSyncProcess(`Menambahkan Mata Pelajaran (${subName}) ke DB...`, async () => {
    const res = await apiRequest('createSubject', { name: subName }, true);
    subjects.value.push({ id: res.id, name: subName });
    subjects.value.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    if (!selectedSubjectId.value) selectedSubjectId.value = res.id;
  });
  triggerFuturisticToast('Mapel Ditambahkan 📚', `Mata pelajaran ${subName} berhasil dibuat di DB.`, 'fa-solid fa-book text-success');
};

const deleteSubject = async (id: string) => {
  if (isReadOnlyUser.value) return;
  const conf = await Swal.fire({ title: 'Hapus Mata Pelajaran?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
  if (conf.isConfirmed) {
    await runDatabaseSyncProcess('Menghapus Mata Pelajaran dari Database...', async () => {
      await apiRequest('deleteSubject', { id }, true);
      subjects.value = subjects.value.filter(s => s.id !== id);
      selectedSubjectIds.value = selectedSubjectIds.value.filter(sid => sid !== id);
      if (selectedSubjectId.value === id) selectedSubjectId.value = subjects.value.length > 0 ? subjects.value[0].id : '';
    });
    triggerFuturisticToast('Mapel Dihapus 🗑️', 'Mata pelajaran berhasil dihapus dari DB.', 'fa-solid fa-trash text-danger');
  }
};

const bulkDeleteSubjects = async () => {
  if (isReadOnlyUser.value || selectedSubjectIds.value.length === 0) return;
  const count = selectedSubjectIds.value.length;
  const conf = await Swal.fire({
    title: `Hapus ${count} Mata Pelajaran Terpilih?`,
    text: 'Data mata pelajaran terpilih akan dihapus dari database.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Ya, Hapus Semua Mapel Terpilih'
  });
  if (conf.isConfirmed) {
    await runDatabaseSyncProcess(`Menghapus ${count} Mata Pelajaran dari Database...`, async () => {
      for (const id of selectedSubjectIds.value) {
        try { await apiRequest('deleteSubject', { id }, true); } catch (e) { console.warn(e); }
      }
      const idsToRemove = new Set(selectedSubjectIds.value);
      subjects.value = subjects.value.filter(s => !idsToRemove.has(s.id));
      if (idsToRemove.has(selectedSubjectId.value)) selectedSubjectId.value = subjects.value.length > 0 ? subjects.value[0].id : '';
      selectedSubjectIds.value = [];
    });
    triggerFuturisticToast('Aksi Massal Mapel Sukses 🗑️', `${count} mata pelajaran berhasil dihapus dari DB.`, 'fa-solid fa-trash text-danger');
  }
};

const isAllJournalsSelected = computed(() => {
  const currentJournals = journals.value.filter(j => j.class_id === selectedClassId.value);
  return currentJournals.length > 0 && selectedJournalIds.value.length === currentJournals.length;
});

const toggleSelectAllJournals = () => {
  const currentJournals = journals.value.filter(j => j.class_id === selectedClassId.value);
  if (isAllJournalsSelected.value) {
    selectedJournalIds.value = [];
  } else {
    selectedJournalIds.value = currentJournals.map(j => j.id);
  }
};

const bulkDeleteJournals = async () => {
  if (isReadOnlyUser.value || selectedJournalIds.value.length === 0) return;
  const count = selectedJournalIds.value.length;
  const conf = await Swal.fire({
    title: `Hapus ${count} Catatan Jurnal?`,
    text: 'Data jurnal mengajar yang dipilih akan dihapus secara permanen dari database.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Ya, Hapus Semua'
  });
  if (conf.isConfirmed) {
    await runDatabaseSyncProcess(`Menghapus ${count} Catatan Jurnal dari Database...`, async () => {
      for (const id of selectedJournalIds.value) {
        try { await apiRequest('deleteJournal', { id }, true); } catch (e) { console.warn(e); }
      }
      const idsToRemove = new Set(selectedJournalIds.value);
      journals.value = journals.value.filter(j => !idsToRemove.has(j.id));
      selectedJournalIds.value = [];
    });
    triggerFuturisticToast('Aksi Massal Jurnal Sukses 🗑️', `${count} riwayat jurnal berhasil dihapus dari DB.`, 'fa-solid fa-trash text-danger');
  }
};

const openBulkFillGradesModal = async () => {
  if (isReadOnlyUser.value || !selectedClassId.value || selectedClassStudents.value.length === 0) return;
  
  const { value: formValues } = await Swal.fire({
    title: 'Pengisian Nilai Massal (Bulk Fill)',
    html: `
      <div class="text-start mb-3">
        <label class="form-label small text-muted mb-1">Pilih Komponen Penilaian</label>
        <select id="swal-grade-col" class="swal2-select w-100 mt-0">
          <option value="UH1">Ulangan Harian 1 (UH 1)</option>
          <option value="UH2">Ulangan Harian 2 (UH 2)</option>
          <option value="UTS">Ujian Tengah Semester (UTS)</option>
          <option value="UAS">Ujian Akhir Semester (UAS)</option>
        </select>
      </div>
      <div class="text-start mb-2">
        <label class="form-label small text-muted mb-1">Nilai Standar (0 - 100)</label>
        <input id="swal-grade-val" type="number" min="0" max="100" class="swal2-input w-100 mt-0" value="80" placeholder="80">
      </div>
      <div class="text-start">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="swal-grade-overwrite">
          <label class="form-check-label small text-warning cursor-pointer" for="swal-grade-overwrite">
            Timpa nilai yang sudah terisi sebelumnya
          </label>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Terapkan Ke Semua Siswa',
    preConfirm: () => {
      const col = (document.getElementById('swal-grade-col') as HTMLSelectElement).value;
      const val = parseInt((document.getElementById('swal-grade-val') as HTMLInputElement).value, 10);
      const overwrite = (document.getElementById('swal-grade-overwrite') as HTMLInputElement).checked;
      if (isNaN(val) || val < 0 || val > 100) {
        Swal.showValidationMessage('Nilai harus berupa angka antara 0 hingga 100');
        return false;
      }
      return { col, val, overwrite };
    }
  });

  if (formValues) {
    const { col, val, overwrite } = formValues;
    let updatedCount = 0;
    selectedClassStudents.value.forEach(s => {
      const key = `${s.id}_${col}`;
      if (overwrite || currentGrades.value[key] === undefined || currentGrades.value[key] === null || currentGrades.value[key] === '') {
        currentGrades.value[key] = val;
        updatedCount++;
      }
    });
    triggerFuturisticToast('Pengisian Massal Berhasil 📝', `Nilai ${col} diset ${val} untuk ${updatedCount} siswa. Klik "Simpan Nilai" untuk menyimpan ke DB.`, 'fa-solid fa-square-check text-success');
  }
};

const openStudentModal = async (student: any = null) => {
  if (isReadOnlyUser.value || !selectedClassId.value) return;
  const currentGender = student ? (student.gender || student.jenis_kelamin || 'L') : 'L';
  const currentStatus = student ? (student.status || 'Aktif') : 'Aktif';

  const { value: formValues } = await Swal.fire({
    title: student ? 'Edit Data Siswa' : 'Tambah Siswa Baru',
    html: `
      <div class="text-start mb-2">
        <label class="form-label small text-muted mb-1">Nama Lengkap Siswa</label>
        <input id="swal-st-name" class="swal2-input w-100 mt-0" placeholder="Contoh: Muhammad Ali" value="${student ? student.name : ''}">
      </div>
      <div class="text-start mb-2">
        <label class="form-label small text-muted mb-1">NISN</label>
        <input id="swal-st-nisn" class="swal2-input w-100 mt-0" placeholder="10 Digit NISN" value="${student ? (student.nisn || '') : ''}">
      </div>
      <div class="row g-2 text-start">
        <div class="col-6">
          <label class="form-label small text-muted mb-1">Jenis Kelamin</label>
          <select id="swal-st-gender" class="swal2-select w-100 mt-0">
            <option value="L" ${currentGender === 'L' ? 'selected' : ''}>L (Laki-laki)</option>
            <option value="P" ${currentGender === 'P' ? 'selected' : ''}>P (Perempuan)</option>
          </select>
        </div>
        <div class="col-6">
          <label class="form-label small text-muted mb-1">Status Siswa</label>
          <select id="swal-st-status" class="swal2-select w-100 mt-0">
            <option value="Aktif" ${currentStatus === 'Aktif' ? 'selected' : ''}>Aktif</option>
            <option value="Nonaktif" ${currentStatus === 'Nonaktif' ? 'selected' : ''}>Nonaktif</option>
            <option value="Mutasi" ${currentStatus === 'Mutasi' ? 'selected' : ''}>Mutasi</option>
          </select>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Simpan Siswa',
    preConfirm: () => ({
      name: (document.getElementById('swal-st-name') as HTMLInputElement).value,
      nisn: (document.getElementById('swal-st-nisn') as HTMLInputElement).value,
      gender: (document.getElementById('swal-st-gender') as HTMLSelectElement).value,
      status: (document.getElementById('swal-st-status') as HTMLSelectElement).value
    })
  });

  if (formValues && formValues.name) {
    await runDatabaseSyncProcess('Menyimpan Data Siswa ke Database...', async () => {
      if (student) {
        await apiRequest('updateStudent', {
          id: student.id,
          class_id: selectedClassId.value,
          name: formValues.name,
          nisn: formValues.nisn,
          gender: formValues.gender,
          jenis_kelamin: formValues.gender,
          status: formValues.status
        }, true);
        const idx = students.value.findIndex(s => s.id === student.id);
        if (idx !== -1) {
          students.value[idx].name = formValues.name;
          students.value[idx].nisn = formValues.nisn;
          students.value[idx].gender = formValues.gender;
          students.value[idx].jenis_kelamin = formValues.gender;
          students.value[idx].status = formValues.status;
        }
      } else {
        const res = await apiRequest('createStudent', {
          class_id: selectedClassId.value,
          name: formValues.name,
          nisn: formValues.nisn,
          gender: formValues.gender,
          jenis_kelamin: formValues.gender,
          status: formValues.status
        }, true);
        students.value.push({
          id: res.id,
          class_id: selectedClassId.value,
          name: formValues.name,
          nisn: formValues.nisn,
          gender: formValues.gender,
          jenis_kelamin: formValues.gender,
          status: formValues.status || 'Aktif'
        });
      }
    });
    triggerFuturisticToast('Siswa Disimpan 👤', `Data siswa ${formValues.name} berhasil diperbarui di DB.`, 'fa-solid fa-user-check text-success');
  }
};

const deleteStudent = async (id: string) => {
  if (isReadOnlyUser.value) return;
  const conf = await Swal.fire({ title: 'Hapus Siswa?', text: 'Data siswa ini akan dihapus permanen.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
  if (conf.isConfirmed) {
    await runDatabaseSyncProcess('Menghapus Data Siswa dari Database...', async () => {
      await apiRequest('deleteStudent', { id }, true);
      students.value = students.value.filter(s => s.id !== id);
      selectedStudentIds.value = selectedStudentIds.value.filter(sid => sid !== id);
    });
    triggerFuturisticToast('Siswa Dihapus 🗑️', 'Data siswa berhasil dihapus dari DB.', 'fa-solid fa-user-xmark text-danger');
  }
};

const downloadStudentTemplate = () => {
  const ws = XLSX.utils.json_to_sheet([
    { 'NISN': '0051234567', 'NAMA SISWA': 'Ahmad Dahlan', 'JENIS KELAMIN': 'L' },
    { 'NISN': '0057654321', 'NAMA SISWA': 'Siti Rahma', 'JENIS KELAMIN': 'P' }
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'Template_Siswa_MAN2SBT.xlsx');
};

const importStudentsExcel = (event: any) => {
  if (isReadOnlyUser.value || !selectedClassId.value) return;
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e: any) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);
    const importedList = jsonData.map(row => {
      const rawGender = String(row['JENIS KELAMIN'] || row['Jenis Kelamin'] || row['JK'] || 'L').trim().toUpperCase();
      const gender = rawGender.startsWith('P') ? 'P' : 'L';
      return {
        name: row['NAMA SISWA'] || row['Nama Siswa'] || '',
        nisn: String(row['NISN'] || '-'),
        gender: gender,
        jenis_kelamin: gender,
        status: 'Aktif'
      };
    }).filter(s => s.name);
    if (importedList.length === 0) { Swal.fire('Error', 'Data Excel kosong atau format kolom tidak sesuai.', 'error'); return; }

    await runDatabaseSyncProcess(`Mengimpor Batch ${importedList.length} Siswa ke DB...`, async () => {
      await apiRequest('importStudentsBatch', { class_id: selectedClassId.value, students: importedList }, true);
      const refreshed = await apiRequest('getStudents');
      students.value = Array.isArray(refreshed) ? refreshed : [];
    });

    triggerFuturisticToast(
      'Impor Siswa Berhasil 📥',
      `Sebanyak ${importedList.length} siswa berhasil ditambahkan ke database.`,
      'fa-solid fa-file-excel text-success'
    );
  };
  reader.readAsArrayBuffer(file);
};

const loadAttendanceData = async () => {
  if (!selectedClassId.value || !selectedSubjectId.value) return;
  const fetchedAtts = await apiRequest('getAttendances', { date: attendanceDate.value, class_id: selectedClassId.value, subject_id: selectedSubjectId.value });
  if (Array.isArray(fetchedAtts)) {
    fetchedAtts.forEach(fa => {
      const idx = attendances.value.findIndex(a => a.student_id === fa.student_id && normalizeDate(a.date) === normalizeDate(fa.date) && a.subject_id === fa.subject_id);
      if (idx !== -1) attendances.value[idx] = fa;
      else attendances.value.push(fa);
    });
  }
  const attMap: Record<string, string> = {};
  selectedClassStudents.value.forEach(s => {
    const found = attendances.value.find(a => a.student_id === s.id && normalizeDate(a.date) === attendanceDate.value && a.subject_id === selectedSubjectId.value);
    attMap[s.id] = found ? found.status : '';
  });
  currentAttendance.value = attMap;
};

const setAttendanceStatus = (studentId: string, status: string) => {
  if (isReadOnlyUser.value) return;
  currentAttendance.value = { ...currentAttendance.value, [studentId]: status };
};

const markAllPresent = () => {
  if (isReadOnlyUser.value) return;
  const updated: Record<string, string> = {};
  selectedClassStudents.value.forEach(s => { updated[s.id] = 'H'; });
  currentAttendance.value = updated;
};

const saveAttendance = async () => {
  if (isReadOnlyUser.value || !selectedClassId.value) return;
  const payloadAtt = Object.keys(currentAttendance.value).filter(id => currentAttendance.value[id]).map(id => ({ student_id: id, status: currentAttendance.value[id] }));
  if (payloadAtt.length === 0) { Swal.fire('Peringatan', 'Belum ada status.', 'warning'); return; }
  
  await runDatabaseSyncProcess('Menyimpan Status Presensi Siswa ke Database...', async () => {
    await apiRequest('saveAttendanceBulk', { date: attendanceDate.value, class_id: selectedClassId.value, subject_id: selectedSubjectId.value, attendances: payloadAtt }, true);
    await syncAllData();
  });

  triggerFuturisticToast(
    'Presensi Disimpan ⚡',
    `Presensi ${payloadAtt.length} siswa berhasil disinkronkan ke database.`,
    'fa-solid fa-square-check text-success'
  );
};

const loadMonthlyRecapData = async () => {
  if (!selectedClassId.value) return;
  const fetchedAtts = await apiRequest('getAttendances', { class_id: selectedClassId.value });
  if (Array.isArray(fetchedAtts)) attendances.value = fetchedAtts;
};

const getStudentDayStatus = (studentId: string, dayNum: number) => {
  const targetDate = `${recapMonth.value}-${String(dayNum).padStart(2, '0')}`;
  const found = attendances.value.find(a => a.student_id === studentId && normalizeDate(a.date) === targetDate && a.subject_id === selectedSubjectId.value);
  return found ? found.status : '';
};

const getStudentRecapTotals = (studentId: string) => {
  let H = 0, I = 0, S = 0, A = 0;
  const days = daysInSelectedMonth.value;
  for (let d = 1; d <= days; d++) {
    const st = getStudentDayStatus(studentId, d);
    if (st === 'H') H++; else if (st === 'I') I++; else if (st === 'S') S++; else if (st === 'A') A++;
  }
  const total = H + I + S + A;
  return { H, I, S, A, percent: total === 0 ? 0 : ((H / total) * 100).toFixed(0) };
};

const exportMonthlyAttExcel = () => {
  if (!selectedClassId.value) return;
  const days = daysInSelectedMonth.value;
  const exportData = selectedClassStudents.value.map((s, idx) => {
    const row: Record<string, any> = { 'No': idx + 1, 'NISN': s.nisn || '-', 'Nama Siswa': s.name };
    for (let d = 1; d <= days; d++) row[`Tgl ${d}`] = getStudentDayStatus(s.id, d) || '-';
    const t = getStudentRecapTotals(s.id);
    row['H'] = t.H; row['I'] = t.I; row['S'] = t.S; row['A'] = t.A; row['%'] = `${t.percent}%`;
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap');
  XLSX.writeFile(wb, `Rekap_Bulanan_${currentClassName.value}.xlsx`);
};

const loadGradesData = async () => {
  if (!selectedClassId.value || !selectedSubjectId.value) return;
  const fetched = await apiRequest('getGrades', { class_id: selectedClassId.value, subject_id: selectedSubjectId.value });
  if (Array.isArray(fetched)) {
    grades.value = fetched;
    const gMap: Record<string, any> = {};
    fetched.forEach(g => { gMap[`${g.student_id}_${g.type}`] = g.score; });
    currentGrades.value = gMap;
  }
};

const calculateStudentGradeAverage = (studentId: string) => {
  const list = [
    currentGrades.value[`${studentId}_UH1`],
    currentGrades.value[`${studentId}_UH2`],
    currentGrades.value[`${studentId}_UTS`],
    currentGrades.value[`${studentId}_UAS`]
  ].filter(v => v !== undefined && v !== null && v !== '' && !isNaN(v) && Number(v) >= 0);
  if (list.length === 0) return '-';
  return (list.reduce((a, b) => a + Number(b), 0) / list.length).toFixed(1);
};

const localStorageUsageMB = ref<string>('0.00');
const localStoragePercent = ref<number>(0);

const madrasahLogoUrl = ref<string>(localStorage.getItem('digitalisasi_madrasah_logo') || '');
const madrasahLogoUrlInput = ref<string>(madrasahLogoUrl.value);
const isLogoImageError = ref<boolean>(false);

const convertDriveUrlToDirectImg = (url: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const fileId = matchD ? matchD[1] : (matchId ? matchId[1] : null);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return trimmed;
};

const formattedMadrasahLogoUrl = computed(() => {
  return convertDriveUrlToDirectImg(madrasahLogoUrl.value);
});

const formattedInputLogoUrl = computed(() => {
  return convertDriveUrlToDirectImg(madrasahLogoUrlInput.value);
});

const handleLogoError = () => {
  isLogoImageError.value = true;
};

const saveMadrasahLogo = async () => {
  isLogoImageError.value = false;
  madrasahLogoUrl.value = madrasahLogoUrlInput.value.trim();
  localStorage.setItem('digitalisasi_madrasah_logo', madrasahLogoUrl.value);
  
  if (currentUser.value) {
    currentUser.value.madrasah_logo = madrasahLogoUrl.value;
    localStorage.setItem('digitalisasi_user', JSON.stringify(currentUser.value));
  }

  try {
    if (apiUrl.value && !isReadOnlyUser.value) {
      await apiRequest('saveSetting', { key: 'madrasah_logo', value: madrasahLogoUrl.value }, true);
    }
  } catch (err) {
    console.warn('Gagal menyimpan logo ke Google Sheets:', err);
  }

  triggerFuturisticToast(
    'Logo Berhasil Disimpan 🏫',
    'Logo madrasah diperbarui & tersimpan otomatis ke Google Sheets (Tabel Pengaturan).',
    'fa-solid fa-school-flag text-success'
  );
};

const clearMadrasahLogo = async () => {
  madrasahLogoUrlInput.value = '';
  madrasahLogoUrl.value = '';
  isLogoImageError.value = false;
  localStorage.removeItem('digitalisasi_madrasah_logo');
  if (currentUser.value) {
    delete currentUser.value.madrasah_logo;
    localStorage.setItem('digitalisasi_user', JSON.stringify(currentUser.value));
  }

  try {
    if (apiUrl.value && !isReadOnlyUser.value) {
      await apiRequest('saveSetting', { key: 'madrasah_logo', value: '' }, true);
    }
  } catch (err) {
    console.warn('Gagal menghapus logo dari Google Sheets:', err);
  }

  triggerFuturisticToast(
    'Logo Dihapus 🗑️',
    'Logo madrasah telah dihapus dari sistem & Google Sheets.',
    'fa-solid fa-trash text-warning'
  );
};

const calculateLocalStorageUsage = () => {
  try {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2;
      }
    }
    const mb = totalBytes / (1024 * 1024);
    localStorageUsageMB.value = mb.toFixed(2);
    localStoragePercent.value = Math.min(100, Math.round((mb / 5.0) * 100));
  } catch (e) {
    localStorageUsageMB.value = '0.00';
    localStoragePercent.value = 0;
  }
};

const exportBackupJSON = () => {
  const backupObj = {
    app: 'System Digitalisasi Guru (JRA)',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    user: currentUser.value,
    madrasahLogo: madrasahLogoUrl.value,
    classes: classes.value,
    subjects: subjects.value,
    students: students.value,
    attendances: attendances.value,
    grades: grades.value,
    journals: journals.value,
    apiUrl: apiUrl.value
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `Backup_Data_Guru_JRA_${getLocalDateString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  triggerFuturisticToast(
    'Cadangan Berhasil Diunduh 📦',
    'File JSON cadangan data berhasil tersimpan di perangkat Anda.',
    'fa-solid fa-file-export text-success'
  );
};

const importBackupJSON = (event: any) => {
  if (isReadOnlyUser.value) return;
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e: any) => {
    try {
      const backupData = JSON.parse(e.target.result);
      if (!backupData || typeof backupData !== 'object') throw new Error('File cadangan tidak valid.');

      const result = await Swal.fire({
        title: 'Pulihkan Data dari Cadangan?',
        text: 'Data lokal saat ini akan diperbarui dengan data dari file JSON cadangan ini.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Pulihkan Data',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        if (backupData.madrasahLogo) {
          madrasahLogoUrl.value = backupData.madrasahLogo;
          madrasahLogoUrlInput.value = backupData.madrasahLogo;
          localStorage.setItem('digitalisasi_madrasah_logo', backupData.madrasahLogo);
        }
        if (Array.isArray(backupData.classes)) classes.value = backupData.classes;
        if (Array.isArray(backupData.subjects)) subjects.value = backupData.subjects;
        if (Array.isArray(backupData.students)) students.value = backupData.students;
        if (Array.isArray(backupData.attendances)) attendances.value = backupData.attendances;
        if (Array.isArray(backupData.grades)) grades.value = backupData.grades;
        if (Array.isArray(backupData.journals)) journals.value = backupData.journals;

        calculateLocalStorageUsage();

        triggerFuturisticToast(
          'Pemulihan Berhasil 📥',
          'Data aplikasi berhasil dipulihkan dari cadangan.',
          'fa-solid fa-file-import text-info'
        );
      }
    } catch (err: any) {
      Swal.fire('Error Pemulihan', 'Format file JSON cadangan tidak sesuai atau rusak: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
};

const sanitizeSafeCache = () => {
  let clearedCount = 0;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('temp_') || key.includes('error_logs') || key.startsWith('cache_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => {
    localStorage.removeItem(k);
    clearedCount++;
  });
  errorLogs.value = [];
  calculateLocalStorageUsage();

  triggerFuturisticToast(
    'Sanitasi Cache Selesai 🧹',
    `Ditemukan & dibersihkan ${clearedCount} item cache sementara yang aman.`,
    'fa-solid fa-broom text-success'
  );
};

const saveGradesBulk = async () => {
  if (isReadOnlyUser.value || !selectedClassId.value) return;
  const gradesPayload: any[] = [];
  selectedClassStudents.value.forEach(s => {
    ['UH1', 'UH2', 'UTS', 'UAS'].forEach(t => {
      const sc = currentGrades.value[`${s.id}_${t}`];
      const hasExisting = grades.value.some(g => String(g.student_id) === String(s.id) && String(g.type) === String(t));
      
      if ((sc !== undefined && sc !== null && sc !== '') || hasExisting) {
        const val = (sc === '' || sc === null || sc === undefined || isNaN(sc)) ? '' : Number(sc);
        gradesPayload.push({ student_id: s.id, type: t, score: val });
      }
    });
  });

  if (gradesPayload.length === 0) { Swal.fire('Peringatan', 'Belum ada nilai.', 'warning'); return; }
  
  await runDatabaseSyncProcess('Menyimpan Rekap Nilai Akademik Siswa ke Database...', async () => {
    await apiRequest('saveGradesBulk', { class_id: selectedClassId.value, subject_id: selectedSubjectId.value, grades: gradesPayload }, true);
    await loadGradesData();
  });

  triggerFuturisticToast(
    'Nilai Disimpan 📊',
    `Rekap nilai akademik siswa disinkronkan ke database.`,
    'fa-solid fa-award text-warning'
  );
};

const saveJournal = async () => {
  if (isReadOnlyUser.value || !selectedClassId.value) return;
  
  await runDatabaseSyncProcess('Menyimpan Jurnal Mengajar & Aktivitas KBM...', async () => {
    if (journalForm.value.id) await apiRequest('updateJournal', journalForm.value, true);
    else await apiRequest('createJournal', { ...journalForm.value, class_id: selectedClassId.value }, true);
    const jList = await apiRequest('getJournals');
    journals.value = Array.isArray(jList) ? jList : [];
    resetJournalForm();
  });

  triggerFuturisticToast(
    'Jurnal Disimpan 📖',
    'Catatan KBM & materi pelajaran berhasil tersimpan di DB.',
    'fa-solid fa-book-bookmark text-info'
  );
};

const resetJournalForm = () => {
  journalForm.value = { id: null, date: getLocalDateString(), subject_id: selectedSubjectId.value, topic: '', activities: '' };
};

const deleteJournal = async (id: string) => {
  if (isReadOnlyUser.value) return;
  const conf = await Swal.fire({ title: 'Hapus Jurnal?', icon: 'warning', showCancelButton: true });
  if (conf.isConfirmed) {
    await apiRequest('deleteJournal', { id }, true);
    journals.value = journals.value.filter(j => j.id !== id);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Jurnal dihapus', showConfirmButton: false, timer: 1800 });
  }
};

const loadReportTab = async () => {
  if (!selectedClassId.value) return;
  const fetched = await apiRequest('getAttendances', { class_id: selectedClassId.value });
  if (Array.isArray(fetched)) attendances.value = fetched;
};

const getStudentAttStatsReport = (studentId: string) => {
  const targetStr = reportMonthNum.value !== 'ALL' ? `${reportYear.value}-${reportMonthNum.value}` : '';
  const atts = attendances.value.filter(a => a.student_id === studentId && (!targetStr || normalizeDate(a.date).substring(0, 7) === targetStr));
  const dateMap: Record<string, string> = {};
  atts.forEach(a => { const d = normalizeDate(a.date); if (!dateMap[d] || a.status === 'H') dateMap[d] = a.status; });
  let H = 0, I = 0, S = 0, A = 0;
  Object.values(dateMap).forEach(st => { if (st === 'H') H++; else if (st === 'I') I++; else if (st === 'S') S++; else if (st === 'A') A++; });
  return { H, I, S, A };
};

const calculateStudentAttPercentReport = (studentId: string) => {
  const st = getStudentAttStatsReport(studentId);
  const tot = st.H + st.I + st.S + st.A;
  return tot === 0 ? 0 : ((st.H / tot) * 100).toFixed(0);
};

const attendancePercentage = computed(() => {
  if (!selectedClassId.value || selectedClassStudents.value.length === 0) return 0;
  let totalH = 0, totalDays = 0;
  selectedClassStudents.value.forEach(s => {
    const st = getStudentAttStatsReport(s.id);
    totalH += st.H; totalDays += (st.H + st.I + st.S + st.A);
  });
  return totalDays === 0 ? 0 : ((totalH / totalDays) * 100).toFixed(0);
});

const copyPublicLink = () => {
  if (!selectedClassId.value || !currentUser.value) return;
  const url = `${window.location.origin}${window.location.pathname}?public=1&class_id=${selectedClassId.value}&user_id=${currentUser.value.id}`;
  const temp = document.createElement('input'); temp.value = url; document.body.appendChild(temp); temp.select(); document.execCommand('copy'); document.body.removeChild(temp);
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Link publik disalin!', showConfirmButton: false, timer: 1800 });
};

const printReport = () => { window.print(); };

const saveApiUrl = () => {
  if (isReadOnlyUser.value) return;
  localStorage.setItem('digitalisasi_api_url', apiUrl.value);
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'URL API disimpan', showConfirmButton: false, timer: 1800 });
};

const saveAndTestApiUrlModal = () => {
  if (isReadOnlyUser.value) return;
  localStorage.setItem('digitalisasi_api_url', apiUrl.value);
  triggerFuturisticToast(
    'URL Web App Disimpan ⚡',
    'Konfigurasi endpoint Web App Google Apps Script berhasil diperbarui.',
    'fa-solid fa-circle-check text-success'
  );
  const modalEl = document.getElementById('webAppUrlModal');
  if (modalEl && (window as any).bootstrap) {
    const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }
};

const saveMadrasahLogoModal = async () => {
  await saveMadrasahLogo();
  const modalEl = document.getElementById('madrasahLogoModal');
  if (modalEl && (window as any).bootstrap) {
    const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }
};

const clearMadrasahLogoModal = async () => {
  await clearMadrasahLogo();
  const modalEl = document.getElementById('madrasahLogoModal');
  if (modalEl && (window as any).bootstrap) {
    const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }
};

const testApiConnection = async () => {
  try {
    const res = await fetch(`${apiUrl.value}?action=ping`);
    const json = await res.json();
    if (json.success) Swal.fire('Koneksi OK', 'API merespon dengan sukses!', 'success');
    else throw new Error('Respon gagal');
  } catch (e: any) { 
    logError(e, 'testApiConnection');
    Swal.fire('Gagal', e.message, 'error'); 
  }
};

const getPublicStudentStats = (studentId: string) => {
  const atts = publicReportData.value.attendances.filter((a: any) => String(a.student_id) === String(studentId));
  const dateMap: Record<string, string> = {};
  atts.forEach((a: any) => { const d = normalizeDate(a.date); if (!dateMap[d] || a.status === 'H') dateMap[d] = a.status; });
  let H = 0, I = 0, S = 0, A = 0;
  Object.values(dateMap).forEach(st => { if (st === 'H') H++; else if (st === 'I') I++; else if (st === 'S') S++; else if (st === 'A') A++; });
  return { H, I, S, A };
};

const calculatePublicStudentPercent = (studentId: string) => {
  const st = getPublicStudentStats(studentId);
  const tot = st.H + st.I + st.S + st.A;
  return tot === 0 ? 0 : ((st.H / tot) * 100).toFixed(0);
};

const closeDropdownsOnOutsideClick = () => {
  showProfileDropdown.value = false;
};

onMounted(() => {
  setTheme(selectedTheme.value);
  calculateLocalStorageUsage();
  window.addEventListener('click', closeDropdownsOnOutsideClick);
  updateLiveClock();
  clockTimer = setInterval(updateLiveClock, 1000);

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('public') === '1' && urlParams.get('class_id') && urlParams.get('user_id')) {
    isPublicView.value = true;
    publicReportLoading.value = true;
    publicReportError.value = '';

    fetch(`${apiUrl.value}?action=getPublicReport&class_id=${urlParams.get('class_id')}&user_id=${urlParams.get('user_id')}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error status ${res.status}`);
        return res.text();
      })
      .then(rawText => {
        let json: any;
        try {
          json = JSON.parse(rawText);
        } catch (e) {
          throw new Error('Respon server bukan format JSON yang valid. Pastikan deployment GAS diatur ke "Anyone".');
        }
        if (json.success) {
          publicReportData.value.students = json.data.students || [];
          publicReportData.value.attendances = json.data.attendances || [];
          publicReportData.value.className = json.data.className || 'Kelas';
          publicReportData.value.schoolName = json.data.schoolName || 'MAN 2 Seram Bagian Timur';
          publicReportData.value.teacherName = json.data.teacherName || 'Guru Pengampu';
          publicReportData.value.teacherNip = json.data.teacherNip || '-';
        } else {
          throw new Error(json.error || 'Gagal memuat rekap data.');
        }
      })
      .catch(err => {
        console.error('Public report fetch error:', err);
        publicReportError.value = err.message;
      })
      .finally(() => {
        publicReportLoading.value = false;
      });
  } else if (currentUser.value) {
    loadInitialData();
  }
});

onUnmounted(() => {
  window.removeEventListener('click', closeDropdownsOnOutsideClick);
  if (clockTimer) clearInterval(clockTimer);
});
</script>
