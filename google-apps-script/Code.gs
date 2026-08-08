/**
 * ==============================================================================
 * DIGITALISASI DATA OLEH GURU - MAN 2 SERAM BAGIAN TIMUR
 * Google Apps Script Backend Server (Code.gs)
 * ==============================================================================
 * Petunjuk Deployment GAS:
 * 1. Buka Google Sheets Database Anda.
 * 2. Klik menu Ekstensi -> Apps Script.
 * 3. Hapus seluruh isi default Code.gs, lalu paste seluruh isi file ini.
 * 4. Klik "Simpan" (Ctrl + S).
 * 5. Klik "Terapkan" (Deploy) -> "Penerapan Baru" (New deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. Deskripsi: "Production v1.0"
 * 8. Jalankan sebagai: "Saya" (Me / Akun Google Anda)
 * 9. Yang memiliki akses: "Siapa Saja" (Anyone) -> SANGAT PENTING!
 * 10. Klik "Terapkan", berikan Izin Akses (Authorize Access), lalu Copy URL Web App.
 * ==============================================================================
 */

// Konfigurasi Schema Database
const DB_SCHEMA = {
  Kelas: ['id', 'nama_kelas', 'tahun_ajaran', 'semester', 'created_at'],
  Mapel: ['id', 'nama_mapel', 'created_at'],
  Siswa: ['id', 'class_id', 'nisn', 'nama_siswa', 'jenis_kelamin', 'status', 'created_at'],
  Presensi: ['id', 'class_id', 'student_id', 'tanggal', 'status', 'keterangan', 'updated_at'],
  Penilaian: ['id', 'class_id', 'student_id', 'jenis_penilaian', 'nama_tugas', 'nilai', 'catatan', 'updated_at'],
  Jurnal: ['id', 'class_id', 'tanggal', 'jam_ke', 'materi', 'hambatan', 'solusi', 'absensi_ringkasan', 'created_at'],
  Pengguna: ['id', 'username', 'password', 'nama_lengkap', 'nama_madrasah', 'nip', 'role', 'created_at'],
  Pengaturan: ['key', 'value', 'updated_at']
};

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : 'ping';
    
    if (action === 'ping') {
      return jsonResponse({ success: true, status: 'success', message: 'Backend GAS MAN 2 SBT Aktif', timestamp: new Date() });
    }
    
    if (action === 'getSchema' || action === 'checkSchema') {
      return jsonResponse(checkDatabaseSchema());
    }
    
    if (action === 'repairSchema' || action === 'initDatabase') {
      return jsonResponse(initAndRepairSchema());
    }

    if (action === 'resetDatabase' || action === 'clearDatabase' || action === 'resetDB') {
      return jsonResponse(resetDatabase());
    }
    
    if (action === 'getAllData' || action === 'readAll') {
      return jsonResponse(readAllTablesData());
    }

    if (action === 'getPublicReport') {
      const classId = e.parameter.class_id;
      const month = e.parameter.month;
      return jsonResponse(generatePublicReportData(classId, month));
    }
    
    return jsonResponse({ success: false, status: 'error', message: 'Action GET tidak dikenal: ' + action });
  } catch (error) {
    return jsonResponse({ success: false, status: 'error', message: error.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }
    
    const action = postData.action;
    const payload = postData.payload || postData;
    
    if (action === 'ping') {
      return jsonResponse({ success: true, status: 'success', message: 'Backend GAS POST Aktif' });
    }
    
    if (action === 'repairSchema' || action === 'initDatabase') {
      return jsonResponse(initAndRepairSchema());
    }

    if (action === 'resetDatabase' || action === 'clearDatabase' || action === 'resetDB') {
      return jsonResponse(resetDatabase());
    }

    // Autentikasi & Akun Guru
    if (action === 'login') {
      return jsonResponse(handleLogin(payload));
    }

    if (action === 'register') {
      return jsonResponse(handleRegister(payload));
    }

    if (action === 'updateProfile') {
      return jsonResponse(updateProfile(payload, postData.token));
    }

    // Class / Kelas
    if (action === 'getClasses') {
      return jsonResponse({ success: true, data: fetchClasses() });
    }

    if (action === 'createClass' || action === 'saveClass') {
      return jsonResponse(createClass(payload));
    }

    if (action === 'deleteClass') {
      return jsonResponse(deleteRecord('Kelas', payload.id || postData.id));
    }

    // Subject / Mapel
    if (action === 'getSubjects') {
      return jsonResponse({ success: true, data: fetchSubjects() });
    }

    if (action === 'createSubject') {
      return jsonResponse(createSubject(payload));
    }

    if (action === 'deleteSubject') {
      return jsonResponse(deleteRecord('Mapel', payload.id || postData.id));
    }

    // Student / Siswa
    if (action === 'getStudents') {
      return jsonResponse({ success: true, data: fetchStudents() });
    }

    if (action === 'createStudent' || action === 'saveStudent') {
      return jsonResponse(createStudent(payload));
    }

    if (action === 'updateStudent') {
      return jsonResponse(updateStudent(payload));
    }

    if (action === 'deleteStudent') {
      return jsonResponse(deleteRecord('Siswa', payload.id || postData.id));
    }

    if (action === 'bulkDeleteStudents') {
      return jsonResponse(bulkDeleteRecords('Siswa', payload.ids || postData.ids));
    }

    if (action === 'bulkMoveStudents') {
      return jsonResponse(bulkUpdateField('Siswa', payload.ids || postData.ids, 'class_id', payload.target_class_id || postData.target_class_id));
    }

    if (action === 'bulkUpdateStudentStatus') {
      return jsonResponse(bulkUpdateField('Siswa', payload.ids || postData.ids, 'status', payload.status || postData.status));
    }

    if (action === 'importStudentsBatch') {
      return jsonResponse(importStudentsBatch(payload));
    }

    // Attendance / Presensi
    if (action === 'getAttendances') {
      return jsonResponse({ success: true, data: fetchAttendances() });
    }

    if (action === 'saveAttendanceBatch' || action === 'saveAttendanceBulk' || action === 'saveAttendance') {
      return jsonResponse(handleSaveAttendanceBulk(payload));
    }

    // Grades / Penilaian
    if (action === 'getGrades') {
      return jsonResponse({ success: true, data: fetchGrades() });
    }

    if (action === 'saveGradesBatch' || action === 'saveGradesBulk' || action === 'saveGrades') {
      return jsonResponse(handleSaveGradesBulk(payload));
    }

    // Journals / Jurnal
    if (action === 'getJournals') {
      return jsonResponse({ success: true, data: fetchJournals() });
    }

    if (action === 'saveJournal' || action === 'createJournal' || action === 'updateJournal') {
      return jsonResponse(saveJournal(payload));
    }

    if (action === 'deleteJournal') {
      return jsonResponse(deleteRecord('Jurnal', payload.id || postData.id));
    }

    if (action === 'syncAllData') {
      return jsonResponse(syncAllDataFromClient(payload.data || postData.data));
    }

    return jsonResponse({ success: false, status: 'error', message: 'Action POST tidak dikenal: ' + action });
  } catch (error) {
    return jsonResponse({ success: false, status: 'error', message: error.toString() });
  }
}

/**
 * Memeriksa status dan integritas skema database
 */
function checkDatabaseSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsStatus = {};
  let totalMissingSheets = 0;
  let totalMissingColumns = 0;

  Object.keys(DB_SCHEMA).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheetsStatus[sheetName] = { exists: false, missingColumns: DB_SCHEMA[sheetName] };
      totalMissingSheets++;
    } else {
      const headers = getSheetHeaders(sheet);
      const missing = DB_SCHEMA[sheetName].filter(col => !headers.includes(col));
      sheetsStatus[sheetName] = { exists: true, missingColumns: missing };
      if (missing.length > 0) totalMissingColumns += missing.length;
    }
  });

  return {
    success: totalMissingSheets === 0 && totalMissingColumns === 0,
    status: 'success',
    isHealthy: totalMissingSheets === 0 && totalMissingColumns === 0,
    totalMissingSheets,
    totalMissingColumns,
    details: sheetsStatus
  };
}

/**
 * Membuat & Memperbaiki Struktur Sheet dan Kolom secara Otomatis
 */
function initAndRepairSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const createdSheets = [];
  const repairedHeaders = [];

  Object.keys(DB_SCHEMA).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    const requiredCols = DB_SCHEMA[sheetName];

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, requiredCols.length).setValues([requiredCols]);
      sheet.getRange(1, 1, 1, requiredCols.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      createdSheets.push(sheetName);
    } else {
      const currentHeaders = getSheetHeaders(sheet);
      if (currentHeaders.length === 0) {
        sheet.getRange(1, 1, 1, requiredCols.length).setValues([requiredCols]);
        sheet.getRange(1, 1, 1, requiredCols.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
        sheet.setFrozenRows(1);
        repairedHeaders.push(sheetName + ' (semua kolom)');
      } else {
        const missingCols = requiredCols.filter(col => !currentHeaders.includes(col));
        if (missingCols.length > 0) {
          const startCol = currentHeaders.length + 1;
          const newHeaders = [missingCols];
          sheet.getRange(1, startCol, 1, missingCols.length).setValues(newHeaders);
          sheet.getRange(1, startCol, 1, missingCols.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
          repairedHeaders.push(sheetName + ' (' + missingCols.join(', ') + ')');
        }
      }
    }
  });

  // Hapus "Sheet1" bawaan jika sheet lain sudah siap
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  return {
    success: true,
    status: 'success',
    message: 'Struktur Database Berhasil Diselaraskan',
    createdSheets,
    repairedHeaders
  };
}

/**
 * Menghapus Seluruh Isi Data dari Semua Tabel & Menginisialisasi Ulang Skema Database
 */
function resetDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Object.keys(DB_SCHEMA).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    const requiredCols = DB_SCHEMA[sheetName];

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, requiredCols.length).setValues([requiredCols]);
      sheet.getRange(1, 1, 1, requiredCols.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    } else {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
      }
      sheet.getRange(1, 1, 1, requiredCols.length).setValues([requiredCols]);
      sheet.getRange(1, 1, 1, requiredCols.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  });

  return {
    success: true,
    status: 'success',
    message: 'Database Berhasil Dikosongkan & Diinisialisasi Ulang dengan Skema Lengkap (8 Tabel)'
  };
}

// Handlers khusus Autentikasi
function handleLogin(payload) {
  initAndRepairSchema();
  const username = (payload.username || '').trim();
  const password = (payload.password || '').trim();

  if (!username || !password) {
    return { success: false, message: 'Username dan password wajib diisi' };
  }

  const users = readTableRecords('Pengguna');
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    return {
      success: true,
      data: {
        token: 'token_' + user.id + '_' + new Date().getTime(),
        user: {
          id: user.id,
          username: user.username,
          nama_lengkap: user.nama_lengkap || user.username,
          nama_madrasah: user.nama_madrasah || 'MAN 2 Seram Bagian Timur',
          nip: user.nip || '-',
          role: user.role || 'guru'
        }
      }
    };
  }

  // Jika belum ada user di sheet, daftarkan secara otomatis untuk admin/guru pertama
  if (users.length === 0) {
    const newUser = {
      id: 'usr_' + new Date().getTime(),
      username: username,
      password: password,
      nama_lengkap: 'Guru ' + username,
      nama_madrasah: 'MAN 2 Seram Bagian Timur',
      nip: '-',
      role: 'guru',
      created_at: new Date().toISOString()
    };
    saveRecord('Pengguna', newUser);
    return {
      success: true,
      data: {
        token: 'token_' + newUser.id + '_' + new Date().getTime(),
        user: newUser
      }
    };
  }

  return { success: false, message: 'Username atau password tidak cocok' };
}

function handleRegister(payload) {
  initAndRepairSchema();
  const username = (payload.username || '').trim();
  const password = (payload.password || '').trim();
  const nama_lengkap = (payload.nama_lengkap || '').trim();
  const nip = (payload.nip || '').trim();

  if (!username || !password) {
    return { success: false, message: 'Username dan password wajib diisi' };
  }

  const users = readTableRecords('Pengguna');
  if (users.some(u => u.username === username)) {
    return { success: false, message: 'Username sudah digunakan, gunakan username lain' };
  }

  const newUser = {
    id: 'usr_' + new Date().getTime(),
    username: username,
    password: password,
    nama_lengkap: nama_lengkap || username,
    nama_madrasah: 'MAN 2 Seram Bagian Timur',
    nip: nip || '-',
    role: 'guru',
    created_at: new Date().toISOString()
  };

  saveRecord('Pengguna', newUser);

  return {
    success: true,
    data: {
      token: 'token_' + newUser.id + '_' + new Date().getTime(),
      user: newUser
    }
  };
}

function updateProfile(payload, tokenStr) {
  initAndRepairSchema();
  return { success: true, data: { success: true, message: 'Profil berhasil diperbarui' } };
}

// Handlers Master Data
function fetchClasses() {
  const records = readTableRecords('Kelas');
  return records.map(r => ({
    id: r.id,
    name: r.nama_kelas || r.name || 'Kelas',
    tahun_ajaran: r.tahun_ajaran,
    semester: r.semester
  }));
}

function createClass(payload) {
  const newClass = {
    id: 'cls_' + new Date().getTime(),
    nama_kelas: payload.name || payload.nama_kelas || 'Kelas Baru',
    tahun_ajaran: payload.tahun_ajaran || '2025/2026',
    semester: payload.semester || 'Ganjil',
    created_at: new Date().toISOString()
  };
  saveRecord('Kelas', newClass);
  return { success: true, data: { id: newClass.id, name: newClass.nama_kelas } };
}

function fetchSubjects() {
  const records = readTableRecords('Mapel');
  return records.map(r => ({
    id: r.id,
    name: r.nama_mapel || r.name || 'Mapel'
  }));
}

function createSubject(payload) {
  const newSubject = {
    id: 'sub_' + new Date().getTime(),
    nama_mapel: payload.name || payload.nama_mapel || 'Mapel Baru',
    created_at: new Date().toISOString()
  };
  saveRecord('Mapel', newSubject);
  return { success: true, data: { id: newSubject.id, name: newSubject.nama_mapel } };
}

function fetchStudents() {
  const records = readTableRecords('Siswa');
  return records.map(r => ({
    id: r.id,
    class_id: r.class_id,
    nisn: r.nisn || '-',
    name: r.nama_siswa || r.name || 'Siswa',
    gender: (r.jenis_kelamin || r.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
    jenis_kelamin: (r.jenis_kelamin || r.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
    status: r.status || 'Aktif'
  }));
}

function createStudent(payload) {
  const gender = (payload.gender || payload.jenis_kelamin || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
  const newStudent = {
    id: 'st_' + new Date().getTime() + '_' + Math.floor(Math.random()*100),
    class_id: payload.class_id,
    nisn: payload.nisn || '-',
    nama_siswa: payload.name || payload.nama_siswa || 'Siswa Baru',
    jenis_kelamin: gender,
    status: payload.status || 'Aktif',
    created_at: new Date().toISOString()
  };
  saveRecord('Siswa', newStudent);
  return { success: true, data: { id: newStudent.id, name: newStudent.nama_siswa, nisn: newStudent.nisn, gender: gender, jenis_kelamin: gender, status: newStudent.status } };
}

function updateStudent(payload) {
  const gender = (payload.gender || payload.jenis_kelamin || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
  const rec = {
    id: payload.id,
    class_id: payload.class_id,
    nisn: payload.nisn || '-',
    nama_siswa: payload.name || payload.nama_siswa,
    jenis_kelamin: gender,
    status: payload.status || 'Aktif'
  };
  saveRecord('Siswa', rec);
  return { success: true, data: { success: true } };
}

function importStudentsBatch(payload) {
  if (!payload || !payload.students || !Array.isArray(payload.students)) {
    return { success: false, message: 'Data batch siswa tidak valid' };
  }

  const classId = payload.class_id;
  const records = payload.students.map(s => {
    const g = (s.gender || s.jenis_kelamin || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
    return {
      id: 'st_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000),
      class_id: classId,
      nisn: s.nisn || '-',
      nama_siswa: s.name || s.nama_siswa,
      jenis_kelamin: g,
      status: s.status || 'Aktif',
      created_at: new Date().toISOString()
    };
  });

  saveBatchRecords('Siswa', records, ['id']);
  return { success: true, data: { success: true, count: records.length } };
}

function fetchAttendances() {
  const records = readTableRecords('Presensi');
  return records.map(r => ({
    id: r.id,
    class_id: r.class_id,
    student_id: r.student_id,
    date: r.tanggal || r.date,
    tanggal: r.tanggal || r.date,
    subject_id: r.keterangan || r.subject_id || '',
    status: r.status,
    keterangan: r.keterangan || ''
  }));
}

function handleSaveAttendanceBulk(payload) {
  const classId = payload.class_id;
  const subjectId = payload.subject_id || '';
  const date = payload.date || payload.tanggal;
  const attList = payload.attendances || payload.records || [];

  if (!attList || !Array.isArray(attList)) {
    return { success: false, message: 'Data presensi tidak valid' };
  }

  const recordsToSave = attList.map(item => ({
    id: 'att_' + (item.student_id || '') + '_' + (date || '') + '_' + (subjectId || ''),
    class_id: classId || item.class_id,
    student_id: item.student_id,
    tanggal: date || item.date || item.tanggal,
    status: item.status,
    keterangan: subjectId || item.keterangan || '',
    updated_at: new Date().toISOString()
  }));

  return saveBatchRecords('Presensi', recordsToSave, ['id']);
}

function fetchGrades() {
  const records = readTableRecords('Penilaian');
  return records.map(r => ({
    id: r.id,
    class_id: r.class_id,
    student_id: r.student_id,
    type: r.jenis_penilaian || r.type,
    jenis_penilaian: r.jenis_penilaian || r.type,
    subject_id: r.nama_tugas || r.subject_id || '',
    score: r.nilai !== undefined ? r.nilai : r.score,
    nilai: r.nilai !== undefined ? r.nilai : r.score
  }));
}

function handleSaveGradesBulk(payload) {
  const classId = payload.class_id;
  const subjectId = payload.subject_id || '';
  const gradesList = payload.grades || payload.records || [];

  if (!gradesList || !Array.isArray(gradesList)) {
    return { success: false, message: 'Data nilai tidak valid' };
  }

  const recordsToSave = gradesList.map(item => ({
    id: 'grd_' + (item.student_id || '') + '_' + (subjectId || '') + '_' + (item.type || item.jenis_penilaian || ''),
    class_id: classId || item.class_id,
    student_id: item.student_id,
    jenis_penilaian: item.type || item.jenis_penilaian,
    nama_tugas: subjectId || item.nama_tugas || '',
    nilai: item.score !== undefined ? item.score : item.nilai,
    catatan: item.catatan || '',
    updated_at: new Date().toISOString()
  }));

  return saveBatchRecords('Penilaian', recordsToSave, ['id']);
}

function fetchJournals() {
  const records = readTableRecords('Jurnal');
  return records.map(r => ({
    id: r.id,
    class_id: r.class_id,
    date: r.tanggal || r.date,
    tanggal: r.tanggal || r.date,
    subject_id: r.jam_ke || r.subject_id,
    topic: r.materi || r.topic,
    activities: r.hambatan || r.activities,
    solutions: r.solusi || r.solutions
  }));
}

function saveJournal(payload) {
  const rec = payload.record || payload;
  const jRecord = {
    id: rec.id || ('jrn_' + new Date().getTime()),
    class_id: rec.class_id,
    tanggal: rec.date || rec.tanggal,
    jam_ke: rec.subject_id || rec.jam_ke || '1',
    materi: rec.topic || rec.materi,
    hambatan: rec.activities || rec.hambatan,
    solusi: rec.solutions || rec.solusi || '-',
    absensi_ringkasan: rec.absensi_ringkasan || '',
    created_at: new Date().toISOString()
  };
  saveRecord('Jurnal', jRecord);
  return { success: true, data: { id: jRecord.id } };
}

/**
 * Membaca Semua Record dalam bentuk Array of Objects dari Sheet
 */
function readTableRecords(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, idx) => {
      if (header) {
        obj[header] = row[idx] !== undefined ? row[idx] : '';
      }
    });
    return obj;
  });
}

/**
 * Membaca Semua Data dari Seluruh Tabel Database
 */
function readAllTablesData() {
  initAndRepairSchema();
  const result = {};
  Object.keys(DB_SCHEMA).forEach(sheetName => {
    result[sheetName] = readTableRecords(sheetName);
  });
  return {
    success: true,
    status: 'success',
    data: result
  };
}

/**
 * Sinkronisasi Seluruh Data dari Web App ke Sheet
 */
function syncAllDataFromClient(allData) {
  if (!allData) return { success: false, message: 'Data tidak ditemukan' };
  initAndRepairSchema();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(DB_SCHEMA).forEach(sheetName => {
    if (!allData[sheetName]) return;
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const schemaCols = DB_SCHEMA[sheetName];
    const records = allData[sheetName];

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }

    if (records && records.length > 0) {
      const rowsToWrite = records.map(rec => {
        return schemaCols.map(col => (rec[col] !== undefined && rec[col] !== null) ? rec[col] : '');
      });
      sheet.getRange(2, 1, rowsToWrite.length, schemaCols.length).setValues(rowsToWrite);
    }
  });

  return { success: true, status: 'success', message: 'Seluruh data berhasil disinkronkan ke Spreadsheet' };
}

/**
 * Menyimpan / Updating Satu Record
 */
function saveRecord(sheetName, record) {
  if (!record || !record.id) return { success: false, message: 'Record ID wajib diisi' };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    initAndRepairSchema();
    sheet = ss.getSheetByName(sheetName);
  }

  const headers = getSheetHeaders(sheet);
  const idColIdx = headers.indexOf('id');
  if (idColIdx === -1) return { success: false, message: 'Kolom ID tidak ditemukan di sheet ' + sheetName };

  const data = sheet.getDataRange().getValues();
  let targetRow = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(record.id)) {
      targetRow = i + 1;
      break;
    }
  }

  const rowValues = headers.map(col => record[col] !== undefined && record[col] !== null ? record[col] : '');

  if (targetRow > -1) {
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return { success: true, status: 'success', message: 'Record berhasil disimpan di ' + sheetName };
}

/**
 * Menghapus Satu Record berdasarkan ID
 */
function deleteRecord(sheetName, id) {
  if (!id) return { success: false, message: 'ID wajib diberikan' };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet ' + sheetName + ' tidak ditemukan' };

  const headers = getSheetHeaders(sheet);
  const idColIdx = headers.indexOf('id');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, status: 'success', message: 'Record berhasil dihapus dari ' + sheetName };
    }
  }

  return { success: false, message: 'Record dengan ID ' + id + ' tidak ditemukan' };
}

/**
 * Menghapus Banyak Record sekaligus (Bulk Delete)
 */
function bulkDeleteRecords(sheetName, ids) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { success: false, message: 'Daftar ID tidak valid' };
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet ' + sheetName + ' tidak ditemukan' };

  const headers = getSheetHeaders(sheet);
  const idColIdx = headers.indexOf('id');
  const data = sheet.getDataRange().getValues();

  const strIds = ids.map(id => String(id));
  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    if (strIds.includes(String(data[i][idColIdx]))) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }

  return { success: true, status: 'success', message: deletedCount + ' data siswa berhasil dihapus' };
}

/**
 * Memperbarui Satu Field untuk Banyak Record sekaligus (Bulk Update)
 */
function bulkUpdateField(sheetName, ids, fieldName, value) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { success: false, message: 'Daftar ID tidak valid' };
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet ' + sheetName + ' tidak ditemukan' };

  const headers = getSheetHeaders(sheet);
  const idColIdx = headers.indexOf('id');
  const targetColIdx = headers.indexOf(fieldName);

  if (targetColIdx === -1) {
    return { success: false, message: 'Kolom ' + fieldName + ' tidak ditemukan' };
  }

  const data = sheet.getDataRange().getValues();
  const strIds = ids.map(id => String(id));
  let updatedCount = 0;

  for (let i = 1; i < data.length; i++) {
    if (strIds.includes(String(data[i][idColIdx]))) {
      sheet.getRange(i + 1, targetColIdx + 1).setValue(value);
      updatedCount++;
    }
  }

  return { success: true, status: 'success', message: updatedCount + ' data berhasil diperbarui' };
}

/**
 * Batch Save Records (e.g. Presensi / Penilaian)
 */
function saveBatchRecords(sheetName, records, keyFields) {
  if (!records || !Array.isArray(records)) return { success: false, message: 'Data batch tidak valid' };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    initAndRepairSchema();
    sheet = ss.getSheetByName(sheetName);
  }

  records.forEach(rec => {
    saveRecord(sheetName, rec);
  });

  return { success: true, status: 'success', message: records.length + ' data berhasil disimpan di ' + sheetName };
}

/**
 * Menghasilkan Data Laporan Publik untuk Tampilan Komunitas / Ortu
 */
function generatePublicReportData(classId, month) {
  const all = readAllTablesData().data;
  const classes = all.Kelas || [];
  const targetClass = classes.find(c => String(c.id) === String(classId)) || {};
  const students = (all.Siswa || []).filter(s => String(s.class_id) === String(classId));
  const attendance = (all.Presensi || []).filter(p => String(p.class_id) === String(classId));

  return {
    success: true,
    status: 'success',
    report: {
      className: targetClass.nama_kelas || targetClass.name || 'Kelas Tidak Ditemukan',
      schoolName: 'MAN 2 Seram Bagian Timur',
      monthName: month || 'Keseluruhan',
      students,
      attendance
    }
  };
}

/**
 * Helper Header Sheet
 */
function getSheetHeaders(sheet) {
  if (sheet.getLastColumn() === 0) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

/**
 * Helper Standard JSON Response dengan Format Terunifikasi & CORS Friendly
 */
function jsonResponse(obj) {
  if (obj.status === 'success' && obj.success === undefined) {
    obj.success = true;
  } else if (obj.status === 'error' && obj.success === undefined) {
    obj.success = false;
  }

  if (!obj.success && !obj.error && obj.message) {
    obj.error = obj.message;
  }

  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
