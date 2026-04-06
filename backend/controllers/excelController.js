const ExcelJS = require('exceljs');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const AZUL_REY = '1a237e';

const LOGO_PATH = path.join(__dirname, '../../frontend/img/logo_uba.png');

async function obtenerDatosParaHoja(evento_id, fecha) {
    let filtros = [];
    let params = [];
    if (evento_id) { filtros.push('p.evento_id = ?'); params.push(evento_id); }
    if (fecha) { filtros.push('DATE(p.created_at) = ?'); params.push(fecha); }
    const where = filtros.length > 0 ? 'WHERE ' + filtros.join(' AND ') : '';

    const [totales] = await db.query(`
        SELECT COUNT(*) as total_participaciones,
               SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) as total_premios,
               SUM(CASE WHEN respuestas_correctas = 1 THEN 1 ELSE 0 END) as total_parcial,
               SUM(CASE WHEN respuestas_correctas = 0 THEN 1 ELSE 0 END) as total_cero
        FROM participaciones p ${where}
    `, params);

    const [porPerfil] = await db.query(`
        SELECT perfil, COUNT(*) as total,
               SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) as dos_correctas,
               SUM(CASE WHEN respuestas_correctas = 1 THEN 1 ELSE 0 END) as una_correcta,
               SUM(CASE WHEN respuestas_correctas = 0 THEN 1 ELSE 0 END) as cero_correctas,
               ROUND(SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as porcentaje_premios
        FROM participaciones p ${where}
        GROUP BY perfil ORDER BY total DESC
    `, params);

    const filtrosEst = filtros.length > 0 ? [...filtros, "p.perfil = 'Estudiante'"] : ["p.perfil = 'Estudiante'"];
    const [porEscuelaEst] = await db.query(`
        SELECT escuela, COUNT(*) as total,
               SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) as dos_correctas,
               SUM(CASE WHEN respuestas_correctas = 1 THEN 1 ELSE 0 END) as una_correcta,
               SUM(CASE WHEN respuestas_correctas = 0 THEN 1 ELSE 0 END) as cero_correctas,
               ROUND(SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as porcentaje_premios
        FROM participaciones p WHERE ${filtrosEst.join(' AND ')}
        GROUP BY escuela ORDER BY total DESC
    `, [...params]);

    const filtrosProf = filtros.length > 0 ? [...filtros, "p.perfil = 'Profesor'"] : ["p.perfil = 'Profesor'"];
    const [porEscuelaProf] = await db.query(`
        SELECT escuela, COUNT(*) as total,
               SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) as dos_correctas,
               SUM(CASE WHEN respuestas_correctas = 1 THEN 1 ELSE 0 END) as una_correcta,
               SUM(CASE WHEN respuestas_correctas = 0 THEN 1 ELSE 0 END) as cero_correctas,
               ROUND(SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as porcentaje_premios
        FROM participaciones p WHERE ${filtrosProf.join(' AND ')}
        GROUP BY escuela ORDER BY total DESC
    `, [...params]);

    const filtrosTrab = filtros.length > 0 ? [...filtros, "p.perfil = 'Trabajador'"] : ["p.perfil = 'Trabajador'"];
    const [trabajadores] = await db.query(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) as dos_correctas,
               SUM(CASE WHEN respuestas_correctas = 1 THEN 1 ELSE 0 END) as una_correcta,
               SUM(CASE WHEN respuestas_correctas = 0 THEN 1 ELSE 0 END) as cero_correctas,
               ROUND(SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as porcentaje_premios
        FROM participaciones p WHERE ${filtrosTrab.join(' AND ')}
    `, [...params]);

    const filtrosInv = filtros.length > 0 ? [...filtros, "p.perfil = 'Invitado'"] : ["p.perfil = 'Invitado'"];
    const [invitados] = await db.query(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) as dos_correctas,
               SUM(CASE WHEN respuestas_correctas = 1 THEN 1 ELSE 0 END) as una_correcta,
               SUM(CASE WHEN respuestas_correctas = 0 THEN 1 ELSE 0 END) as cero_correctas,
               ROUND(SUM(CASE WHEN respuestas_correctas = 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as porcentaje_premios
        FROM participaciones p WHERE ${filtrosInv.join(' AND ')}
    `, [...params]);

    return { totales: totales[0], porPerfil, porEscuelaEst, porEscuelaProf, trabajadores: trabajadores[0], invitados: invitados[0] };
}

function estiloEncabezado(cell, color = AZUL_REY) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + color } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
        top: { style: 'thin', color: { argb: 'FFffffff' } },
        bottom: { style: 'thin', color: { argb: 'FFffffff' } },
        left: { style: 'thin', color: { argb: 'FFffffff' } },
        right: { style: 'thin', color: { argb: 'FFffffff' } }
    };
}

function estiloFila(row, index) {
    row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? 'FFF5F6FA' : 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'hair', color: { argb: 'FFe0e0e0' } },
            bottom: { style: 'hair', color: { argb: 'FFe0e0e0' } },
            left: { style: 'hair', color: { argb: 'FFe0e0e0' } },
            right: { style: 'hair', color: { argb: 'FFe0e0e0' } }
        };
    });
}

function agregarSeccion(sheet, titulo) {
    const f = sheet.rowCount + 1;
    sheet.mergeCells(`A${f}:F${f}`);
    const cell = sheet.getCell(`A${f}`);
    cell.value = titulo;
    estiloEncabezado(cell);
    sheet.getRow(f).height = 24;
}

function agregarFilaSubEncabezado(sheet) {
    const row = sheet.addRow(['Escuela / Perfil', 'Total', '2/2 Premio', '1/2 Parcial', '0/2 Sin Acierto', '% Premio']);
    row.eachCell(cell => estiloEncabezado(cell, '283593'));
    sheet.getRow(row.number).height = 20;
    return row;
}

function agregarFilaSubEncabezadoEscuela(sheet) {
    const row = sheet.addRow(['Escuela', 'Participaciones', 'Premios 🏆', '% Premio', '', '']);
    row.eachCell((cell, col) => { if (col <= 4) estiloEncabezado(cell, '283593'); });
    sheet.getRow(row.number).height = 20;
    return row;
}

function agregarFilaDatos(sheet, cols, index) {
    const row = sheet.addRow(cols);
    estiloFila(row, index);
    row.getCell(3).font = { color: { argb: 'FF2e7d32' }, bold: true };
    row.getCell(4).font = { color: { argb: 'FFf57f17' }, bold: true };
    row.getCell(5).font = { color: { argb: 'FFc62828' }, bold: true };
    row.getCell(6).font = { color: { argb: 'FF' + AZUL_REY }, bold: true };
    sheet.getRow(row.number).height = 20;
    return row;
}

function agregarFilaDatosEscuela(sheet, cols, index) {
    const row = sheet.addRow(cols);
    row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? 'FFF5F6FA' : 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'hair', color: { argb: 'FFe0e0e0' } },
            bottom: { style: 'hair', color: { argb: 'FFe0e0e0' } },
            left: { style: 'hair', color: { argb: 'FFe0e0e0' } },
            right: { style: 'hair', color: { argb: 'FFe0e0e0' } }
        };
    });
    row.getCell(3).font = { color: { argb: 'FF2e7d32' }, bold: true };
    row.getCell(4).font = { color: { argb: 'FF' + AZUL_REY }, bold: true };
    sheet.getRow(row.number).height = 20;
    return row;
}

function agregarFilaVacia(sheet) {
    sheet.addRow([]);
}

function agregarNivelCultura(sheet, porcentaje) {
    let nivel, color;
    if (porcentaje >= 70) { nivel = 'Alto ✅'; color = '2e7d32'; }
    else if (porcentaje >= 40) { nivel = 'Medio ⚠️'; color = 'f57f17'; }
    else { nivel = 'Bajo ❌'; color = 'c62828'; }

    const f = sheet.rowCount + 1;
    sheet.mergeCells(`A${f}:F${f}`);
    const cell = sheet.getCell(`A${f}`);
    cell.value = `Nivel de conocimiento: ${nivel}`;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf5f6fa' } };
    cell.font = { bold: true, color: { argb: 'FF' + color }, size: 12 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(f).height = 22;
}

async function agregarMembrete(workbook, sheet, nombreEvento, fechaLabel) {
    const logoId = workbook.addImage({
        filename: LOGO_PATH,
        extension: 'png'
    });

    // Fila 1: espacio vacío arriba
    sheet.getRow(1).height = 15;

    // Fila 2: nombre universidad
    sheet.mergeCells('A2:F2');
    const celUni = sheet.getCell('A2');
    celUni.value = 'UNIVERSIDAD BICENTENARIA DE ARAGUA';
    celUni.font = { bold: true, color: { argb: 'FF1A237E' }, size: 13, name: 'Lexend' };
    celUni.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 18;

    // Fila 3: dependencia
    sheet.mergeCells('A3:F3');
    const celDep = sheet.getCell('A3');
    celDep.value = 'Vicerrectorado Académico — Dirección de Postgrado';
    celDep.font = { bold: false, color: { argb: 'FF1A237E' }, size: 11, name: 'Lexend' };
    celDep.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(3).height = 16;

    // Fila 4: nombre del evento
    sheet.mergeCells('A4:F4');
    const celEvento = sheet.getCell('A4');
    celEvento.value = `Trivia UBA — ${nombreEvento}`;
    celEvento.font = { bold: true, color: { argb: 'FF1A237E' }, size: 11, name: 'Lexend' };
    celEvento.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(4).height = 14;

    // Fila 5: período
    sheet.mergeCells('A5:F5');
    const celFecha = sheet.getCell('A5');
    celFecha.value = `Período: ${fechaLabel}`;
    celFecha.font = { bold: false, color: { argb: 'FF1A237E' }, size: 10, name: 'Lexend' };
    celFecha.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(5).height = 18;

    // Fila 6: espacio separador
    sheet.getRow(6).height = 20;

    // Logo con tamaño y offsets exactos del Excel original
    // cx=1143000 EMUs = 120px ancho, cy=990600 EMUs = 104px alto
    sheet.addImage(logoId, {
        tl: { col: 0, row: 0, colOff: 133350, rowOff: 38100 },
        ext: { width: 120, height: 104 }
    });

    sheet.pageSetup.printTitlesRow = '1:6';
}

async function agregarHoja(workbook, nombreHoja, nombreEvento, fechaLabel, datos) {
    const sheet = workbook.addWorksheet(nombreHoja);
    sheet.properties.defaultRowHeight = 22;

    sheet.pageSetup = {
        paperSize: 5,
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
    };

    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 16;
    sheet.getColumn(3).width = 14;
    sheet.getColumn(4).width = 14;
    sheet.getColumn(5).width = 16;
    sheet.getColumn(6).width = 12;

    await agregarMembrete(workbook, sheet, nombreEvento, fechaLabel);

    // ── 1. RESUMEN GENERAL ──
    agregarSeccion(sheet, '1. RESUMEN GENERAL');
    const { totales } = datos;
    const pct = totales.total_participaciones > 0
        ? Math.round((totales.total_premios / totales.total_participaciones) * 100) : 0;

    const hRes = sheet.addRow(['Métrica', 'Total', '2/2 Premio', '1/2 Parcial', '0/2 Sin Acierto', '% Premio']);
    hRes.eachCell((cell, col) => { if (col <= 6) estiloEncabezado(cell, '283593'); });
    sheet.getRow(hRes.number).height = 20;

    const dRes = sheet.addRow(['Resultados Generales', totales.total_participaciones || 0, totales.total_premios || 0, totales.total_parcial || 0, totales.total_cero || 0, pct + '%']);
    estiloFila(dRes, 0);
    dRes.getCell(1).font = { bold: true, size: 12 };
    dRes.getCell(2).font = { bold: true, color: { argb: 'FF' + AZUL_REY }, size: 12 };
    dRes.getCell(3).font = { bold: true, color: { argb: 'FF2e7d32' }, size: 12 };
    dRes.getCell(4).font = { bold: true, color: { argb: 'FFf57f17' }, size: 12 };
    dRes.getCell(5).font = { bold: true, color: { argb: 'FFc62828' }, size: 12 };
    dRes.getCell(6).font = { bold: true, color: { argb: 'FF' + AZUL_REY }, size: 12 };
    sheet.getRow(dRes.number).height = 26;

    agregarFilaVacia(sheet);

    // ── 2. DISTRIBUCIÓN POR PERFIL ──
    agregarSeccion(sheet, '2. DISTRIBUCIÓN POR PERFIL');
    const hDist = sheet.addRow(['Perfil', 'Participaciones', '% del Total', '', '', '']);
    hDist.eachCell((cell, col) => { if (col <= 3) estiloEncabezado(cell, '283593'); });
    sheet.getRow(hDist.number).height = 20;

    datos.porPerfil.forEach((p, i) => {
        const pctPerfil = totales.total_participaciones > 0
            ? Math.round((p.total / totales.total_participaciones) * 100) : 0;
        const row = sheet.addRow([p.perfil, p.total, pctPerfil + '%', '', '', '']);
        estiloFila(row, i);
        row.getCell(1).font = { bold: true };
        row.getCell(2).font = { bold: true, color: { argb: 'FF' + AZUL_REY } };
        row.getCell(3).font = { bold: true, color: { argb: 'FF283593' } };
        sheet.getRow(row.number).height = 20;
    });

    agregarFilaVacia(sheet);

    // ── 3. RESULTADOS POR PERFIL ──
    agregarSeccion(sheet, '3. RESULTADOS POR PERFIL');
    agregarFilaSubEncabezado(sheet);
    datos.porPerfil.forEach((p, i) => {
        agregarFilaDatos(sheet, [p.perfil, p.total, p.dos_correctas, p.una_correcta, p.cero_correctas, p.porcentaje_premios + '%'], i);
    });

    agregarFilaVacia(sheet);

    // ── 4. DESGLOSE POR ESCUELA - ESTUDIANTES ──
    agregarSeccion(sheet, '4. DESGLOSE POR ESCUELA - ESTUDIANTES');
    agregarFilaSubEncabezado(sheet);
    if (datos.porEscuelaEst.length > 0) {
        datos.porEscuelaEst.forEach((e, i) => {
            agregarFilaDatos(sheet, [e.escuela || 'Sin escuela', e.total, e.dos_correctas, e.una_correcta, e.cero_correctas, e.porcentaje_premios + '%'], i);
        });
    } else {
        const row = sheet.addRow(['Sin participaciones de estudiantes', '', '', '', '', '']);
        sheet.mergeCells(`A${row.number}:F${row.number}`);
        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(1).font = { color: { argb: 'FFaaaaaa' } };
    }

    agregarFilaVacia(sheet);

    // ── 5. DESGLOSE POR ESCUELA - PROFESORES ──
    agregarSeccion(sheet, '5. DESGLOSE POR ESCUELA - PROFESORES');
    agregarFilaSubEncabezado(sheet);
    if (datos.porEscuelaProf.length > 0) {
        datos.porEscuelaProf.forEach((e, i) => {
            agregarFilaDatos(sheet, [e.escuela || 'Sin escuela', e.total, e.dos_correctas, e.una_correcta, e.cero_correctas, e.porcentaje_premios + '%'], i);
        });
    } else {
        const row = sheet.addRow(['Sin participaciones de profesores', '', '', '', '', '']);
        sheet.mergeCells(`A${row.number}:F${row.number}`);
        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(1).font = { color: { argb: 'FFaaaaaa' } };
    }

    agregarFilaVacia(sheet);

    // ── 6. PARTICIPACIONES Y PREMIOS POR ESCUELA - ESTUDIANTES ──
    agregarSeccion(sheet, '6. PARTICIPACIONES Y PREMIOS POR ESCUELA - ESTUDIANTES');
    agregarFilaSubEncabezadoEscuela(sheet);
    if (datos.porEscuelaEst.length > 0) {
        datos.porEscuelaEst.forEach((e, i) => {
            agregarFilaDatosEscuela(sheet, [e.escuela || 'Sin escuela', e.total, e.dos_correctas, e.porcentaje_premios + '%', '', ''], i);
        });
    } else {
        const row = sheet.addRow(['Sin participaciones de estudiantes', '', '', '', '', '']);
        sheet.mergeCells(`A${row.number}:F${row.number}`);
        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(1).font = { color: { argb: 'FFaaaaaa' } };
    }

    agregarFilaVacia(sheet);

    // ── 7. PARTICIPACIONES Y PREMIOS POR ESCUELA - PROFESORES ──
    agregarSeccion(sheet, '7. PARTICIPACIONES Y PREMIOS POR ESCUELA - PROFESORES');
    agregarFilaSubEncabezadoEscuela(sheet);
    if (datos.porEscuelaProf.length > 0) {
        datos.porEscuelaProf.forEach((e, i) => {
            agregarFilaDatosEscuela(sheet, [e.escuela || 'Sin escuela', e.total, e.dos_correctas, e.porcentaje_premios + '%', '', ''], i);
        });
    } else {
        const row = sheet.addRow(['Sin participaciones de profesores', '', '', '', '', '']);
        sheet.mergeCells(`A${row.number}:F${row.number}`);
        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(1).font = { color: { argb: 'FFaaaaaa' } };
    }

    agregarFilaVacia(sheet);

    // ── 8. ÍNDICE DE CULTURA - TRABAJADORES ──
    agregarSeccion(sheet, '8. ÍNDICE DE CULTURA ORGANIZACIONAL - TRABAJADORES');
    const hTrab = sheet.addRow(['Perfil', 'Total', '2/2 Premio', '1/2 Parcial', '0/2 Sin Acierto', '% Premio']);
    hTrab.eachCell(cell => estiloEncabezado(cell, '283593'));
    sheet.getRow(hTrab.number).height = 20;
    const t = datos.trabajadores;
    agregarFilaDatos(sheet, ['Trabajador', t.total || 0, t.dos_correctas || 0, t.una_correcta || 0, t.cero_correctas || 0, (t.porcentaje_premios || 0) + '%'], 0);
    agregarNivelCultura(sheet, t.porcentaje_premios || 0);

    agregarFilaVacia(sheet);

    // ── 9. ÍNDICE DE CULTURA - INVITADOS ──
    agregarSeccion(sheet, '9. ÍNDICE DE CULTURA UNIVERSITARIA - INVITADOS');
    const hInv = sheet.addRow(['Perfil', 'Total', '2/2 Premio', '1/2 Parcial', '0/2 Sin Acierto', '% Premio']);
    hInv.eachCell(cell => estiloEncabezado(cell, '283593'));
    sheet.getRow(hInv.number).height = 20;
    const inv = datos.invitados;
    agregarFilaDatos(sheet, ['Invitado', inv.total || 0, inv.dos_correctas || 0, inv.una_correcta || 0, inv.cero_correctas || 0, (inv.porcentaje_premios || 0) + '%'], 0);
    agregarNivelCultura(sheet, inv.porcentaje_premios || 0);
}

const exportarExcel = async (req, res) => {
    try {
        const { evento_id, dias, modo } = req.body;

        let nombreEvento = 'Todos los eventos';
        if (evento_id) {
            const [eventos] = await db.query('SELECT nombre FROM eventos WHERE id = ?', [evento_id]);
            if (eventos.length > 0) nombreEvento = eventos[0].nombre;
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Trivia UBA';
        workbook.created = new Date();

        if (modo === 'resumen' || !dias || dias.length === 0) {
            const datos = await obtenerDatosParaHoja(evento_id, null);
            await agregarHoja(workbook, 'Resumen General', nombreEvento, 'Todos los días', datos);
        } else {
            for (let i = 0; i < dias.length; i++) {
                const fecha = dias[i];
                const [y, m, d] = fecha.split('-');
                const fechaStr = new Date(y, m - 1, d).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
                const nombreHoja = `Día ${i + 1} - ${d}-${m}`;
                const datos = await obtenerDatosParaHoja(evento_id, fecha);
                await agregarHoja(workbook, nombreHoja, nombreEvento, fechaStr, datos);
            }
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-trivia-uba-${Date.now()}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error Excel:', error);
        res.status(500).json({ success: false, mensaje: 'Error al generar Excel', error: error.message });
    }
};

module.exports = { exportarExcel };