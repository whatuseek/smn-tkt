// backend/controllers/reportController.js
import asyncHandler from 'express-async-handler';
import supabase from '../config/supabaseClient.js';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { createObjectCsvStringifier } from 'csv-writer';
import exceljs from 'exceljs';
import { parseISO, isValid, format as formatDate, startOfDay, endOfDay } from 'date-fns';
import PdfPrinter from 'pdfmake';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../fonts/Roboto-Medium.ttf'),
        italics: path.join(__dirname, '../fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '../fonts/Roboto-MediumItalic.ttf')
    },
    Raleway: {
        normal: path.join(__dirname, '../fonts/Raleway-Regular.ttf'),
        bold: path.join(__dirname, '../fonts/Raleway-Bold.ttf'),
        italics: path.join(__dirname, '../fonts/Raleway-Italic.ttf'),
        bolditalics: path.join(__dirname, '../fonts/Raleway-BoldItalic.ttf')
    }
};
const printer = new PdfPrinter(fonts);

const getUserMap = async () => {
    if (!supabaseAdmin) { console.error("Report Controller: Admin client not configured."); return new Map(); }
    try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) { console.error("Supabase error listing users:", error); throw new Error(`Failed to list users: ${error.message}`); }
        const userMap = new Map();
        (users || []).forEach(u => { if (u.id) userMap.set(u.id, { email: u.email || 'N/A', display_name: u.user_metadata?.display_name || null }); });
        return userMap;
    } catch (error) { console.error("Error in getUserMap:", error); return new Map(); }
};

const getUserDisplayFromMap = (userId, userMap) => {
    if (!userId) return 'N/A'; if (!userMap || userMap.size === 0) return 'Unknown (Map unavailable)';
    const userInfo = userMap.get(userId); if (!userInfo) return `Unknown (ID: ${userId.substring(0, 8)}...)`;
    return userInfo.display_name || userInfo.email || 'No Name/Email';
};

export const getCombinedTicketReport = asyncHandler(async (req, res, next) => {
    const requestingUserId = req.authUserId || 'Unknown User';
    console.log(`User ${requestingUserId} requested combined ticket report with query:`, req.query);

    const { startDate: startDateString, endDate: endDateString, issueType } = req.query; 

    let startDate = null; let endDate = null;
    if (startDateString) { startDate = parseISO(startDateString); if (!isValid(startDate)) { res.status(400); throw new Error("Invalid Start Date."); return; } }
    if (endDateString) { endDate = parseISO(endDateString); if (!isValid(endDate)) { res.status(400); throw new Error("Invalid End Date."); return; } }
    console.log(`Combined Report filters validated. Start: ${startDate}, End: ${endDate}, IssueType: ${issueType}`);

    try {
        let baseQuery = supabase.from('tickets');
        if (startDate) { baseQuery = baseQuery.gte('created_at', startDate.toISOString()); }
        if (endDate) { baseQuery = baseQuery.lte('created_at', endOfDay(endDate).toISOString()); }
        if (issueType) { baseQuery = baseQuery.eq('issue_type', issueType); }

        console.log("Executing query for combined report data...");
        const { data: tickets, error: dbError } = await baseQuery
            .select('status, issue_type, created_at') 
            .order('created_at', { ascending: false }); 

        if (dbError) {
            console.error(`Supabase DB Error fetching tickets for combined report:`, dbError);
            res.status(500); throw new Error("Database error fetching tickets for combined report.");
        }
        console.log(`Fetched ${tickets?.length ?? 0} tickets for combined analysis.`);

        let totalTickets = 0;
        const statusCounts = { Open: 0, 'In Progress': 0, Resolved: 0 };
        const issueTypeCounts = {};
        const hourlyCounts = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0, label: `${i}:00 - ${i + 1}:00` }));

        if (tickets && tickets.length > 0) {
            totalTickets = tickets.length;
            tickets.forEach(ticket => {
                if (ticket.status && statusCounts.hasOwnProperty(ticket.status)) {
                    statusCounts[ticket.status]++;
                }
                const currentIssueType = ticket.issue_type || 'Unknown Type';
                issueTypeCounts[currentIssueType] = (issueTypeCounts[currentIssueType] || 0) + 1;
                if (ticket.created_at) {
                    const createdAtDate = parseISO(ticket.created_at);
                    const hour = createdAtDate.getHours();
                    if (hour >= 0 && hour <= 23) { hourlyCounts[hour].count++; }
                }
            });
        }
        const byIssueType = Object.entries(issueTypeCounts)
            .map(([type, count]) => ({ issue_type: type, count: count }))
            .sort((a, b) => b.count - a.count); 

        const combinedData = {
            totalTickets: totalTickets,
            byStatus: statusCounts,
            byIssueType: byIssueType,
            hourlyDistribution: hourlyCounts,
            filterCriteria: {
                startDate: startDate ? formatDate(startDate, 'yyyy-MM-dd') : 'N/A',
                endDate: endDate ? formatDate(endDate, 'yyyy-MM-dd') : 'N/A',
                issueType: issueType || 'All Issue Types' 
            }
        };
        console.log("Combined report data calculated.");
        res.status(200).json(combinedData);
    } catch (error) {
        console.error("Unhandled error during combined report generation:", error);
        if (!res.headersSent) {
            res.status(res.statusCode >= 400 ? res.statusCode : 500)
                .json({ success: false, message: error.message || "Internal server error generating combined report." });
        } else { console.error("Error occurred after headers were sent in combined report."); }
    }
});


export const downloadTicketReport = asyncHandler(async (req, res, next) => {
    // **** MANUALLY SETTING CORS HEADERS FOR THIS ROUTE ****
    // This should match your frontend origin. For multiple, you'd need more complex logic
    // or rely solely on the global CORS middleware if it were working correctly.
    const clientOrigin = req.headers.origin || 'http://localhost:5173'; // Fallback if origin header isn't sent (less likely for XHR)
    
    // Check if clientOrigin is in your allowed list if you have one, otherwise set directly.
    // For testing, you can hardcode your frontend origin.
    // const allowedOrigins = (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173']);
    // if (allowedOrigins.includes(clientOrigin)) {
    //     res.setHeader('Access-Control-Allow-Origin', clientOrigin);
    // } // More robustly, you should ensure this logic aligns with your global cors setup.
    // For simplicity in debugging now:
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); // Only GET and OPTIONS needed for this route
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, X-Filename'); // X-Filename as a test

    // Handle OPTIONS preflight request for this route specifically
    if (req.method === 'OPTIONS') {
        console.log('DownloadReport: Handling OPTIONS request explicitly.');
        return res.sendStatus(204); // Or 200
    }
    // **** END MANUAL CORS HEADERS ****


    const requestingUserId = req.authUserId || 'Unknown User';
    console.log(`User ${requestingUserId} requested download report with query:`, req.query);
    const { startDate: startDateString, endDate: endDateString, status, issueType, format: reportFormat = 'csv' } = req.query;
    let startDate = null, endDate = null;
    if (startDateString) { startDate = parseISO(startDateString); if (!isValid(startDate)) { res.status(400); throw new Error("Invalid Start Date."); } }
    if (endDateString) { endDate = parseISO(endDateString); if (!isValid(endDate)) { res.status(400); throw new Error("Invalid End Date."); } }
    if (!['csv', 'xlsx', 'pdf'].includes(reportFormat)) { res.status(400); throw new Error("Invalid format."); }
    
    let userMap = new Map(); try { userMap = await getUserMap(); } catch (e) { console.warn(`Map error: ${e.message}`); }

    try {
        let query = supabase.from('tickets').select('ticket_id, status, issue_type, user_id, mobile_number, location, comments, created_at, created_by_auth_id, updated_at, last_edited_by_auth_id');
        if (startDate) { query = query.gte('created_at', startDate.toISOString()); } 
        if (endDate) { query = query.lte('created_at', endOfDay(endDate).toISOString()); } 
        if (status) { query = query.eq('status', status); } 
        if (issueType) { query = query.eq('issue_type', issueType); } 
        query = query.order('created_at', { ascending: false });
        
        const { data: tickets, error: dbError } = await query;
        if (dbError) { console.error(`DB Error download:`, dbError); res.status(500); throw new Error("DB error for download."); }
        
        const reportData = (tickets || []).map(t => ({ 
            'Ticket ID': t.ticket_id ?? 'N/A', 'Status': t.status ?? 'N/A', 'Issue Type': t.issue_type ?? 'N/A', 
            'User ID': t.user_id ?? 'N/A', 'Mobile': t.mobile_number ?? 'N/A', 'Address': t.location ?? 'N/A', 
            'Comments': t.comments ?? 'N/A', 
            'Created At': t.created_at ? formatDate(parseISO(t.created_at), 'yyyy-MM-dd hh:mm:ss a') : 'N/A', 
            'Created By': getUserDisplayFromMap(t.created_by_auth_id, userMap), 
            'Updated At': t.updated_at ? formatDate(parseISO(t.updated_at), 'yyyy-MM-dd hh:mm:ss a') : 'N/A', 
            'Updated By': getUserDisplayFromMap(t.last_edited_by_auth_id, userMap) 
        }));
        
        const dateStamp = formatDate(new Date(), 'yyyyMMdd_HHmmss'); 
        const filename = `ticket_report_${dateStamp}.${reportFormat}`; 
        
        // Important: Set Content-Disposition and Content-Type *after* CORS headers if setting manually
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        if (reportFormat === 'csv') { 
            res.setHeader('Content-Type', 'text/csv; charset=utf-8'); 
            const headerObjects = Object.keys(reportData[0] || { 'Info': 'No data to export' }).map(key => ({ id: key, title: key }));
            const csvStringifier = createObjectCsvStringifier({ header: headerObjects, recordDelimiter: '\r\n' });
            const headerString = csvStringifier.getHeaderString();
            const recordsString = csvStringifier.stringifyRecords(reportData);
            res.status(200).send(headerString + recordsString); // Ensure status 200 is sent
        }
        else if (reportFormat === 'xlsx') { 
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); 
            const wb = new exceljs.Workbook(); const ws = wb.addWorksheet('Tickets'); 
            if (reportData.length > 0) { 
                ws.columns = Object.keys(reportData[0]).map(k => ({ header: k, key: k, width: (k.includes('Address') || k.includes('Comments')) ? 40 : (k.includes('At') || k.includes('By')) ? 25 : 15, style: { font: { name: 'Calibri', size: 10 }, alignment: { vertical: 'top', wrapText: true } } })); 
                ws.getRow(1).font = { bold: true }; ws.addRows(reportData); 
            } else { 
                ws.columns = [{ header: 'Info', key: 'info', width: 50 }]; ws.addRow({ info: 'No tickets matching criteria.' }); 
            } 
            res.status(200); // Ensure status 200 before writing
            await wb.xlsx.write(res); 
            res.end(); 
        }
        else if (reportFormat === 'pdf') { 
            res.setHeader('Content-Type', 'application/pdf'); 
            let tableBody = []; 
            const headerRow = Object.keys(reportData[0] || { 'Info': 'No data' }).map(key => ({ text: key, style: 'tableHeader' })); 
            tableBody.push(headerRow); 
            if (reportData.length > 0) { 
                reportData.forEach(row => { tableBody.push(Object.values(row).map(value => String(value ?? ''))); }); 
            } else { 
                tableBody.push([{ text: 'No tickets matching criteria.', colSpan: headerRow.length, alignment: 'center' }]); 
            } 
            const widths = headerRow.map(h => h.text.includes('Address') || h.text.includes('Comments') ? '*' : 'auto');

            const docDefinition = { 
                pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [20, 40, 20, 40], 
                content: [
                    { text: `Ticket Report - ${formatDate(new Date(), 'yyyy-MM-dd HH:mm')}`, style: 'header' }, 
                    { text: `Filters: ${status ? `Status(${status})` : ''} ${issueType ? `Issue(${issueType})` : ''} ${startDate ? `From(${formatDate(startDate, 'yyyy-MM-dd')})` : ''} ${endDate ? `To(${formatDate(endDate, 'yyyy-MM-dd')})` : ''}`.replace(/\s\s+/g, ' ').trim() || 'No filters applied', style: 'subheader' }, 
                    { style: 'ticketTable', table: { widths: widths, headerRows: 1, body: tableBody }, layout: 'lightHorizontalLines' }
                ], 
                styles: { 
                    header: { font: 'Raleway', fontSize: 16, bold: true, margin: [0, 0, 0, 10], alignment: 'center' }, 
                    subheader: { font: 'Raleway', fontSize: 9, margin: [0, 0, 0, 15], alignment: 'center', color: 'gray' }, 
                    tableHeader: { font: 'Raleway', bold: true, fontSize: 9, color: 'black', fillColor: '#eeeeee' }, 
                    ticketTable: { font: 'Raleway', margin: [0, 5, 0, 15], fontSize: 8 } 
                }, 
                defaultStyle: { font: 'Raleway' } 
            }; 
            res.status(200); // Ensure status 200 before piping
            const pdfDoc = printer.createPdfKitDocument(docDefinition); 
            pdfDoc.pipe(res); 
            pdfDoc.end(); 
        }
        else { 
            res.status(400); // This status should be set before throwing for the error handler to pick up
            throw new Error("Invalid report format specified."); 
        } 
        console.log(`Report ${filename} sent successfully.`);
    } catch (error) { 
        console.error("Error in downloadTicketReport:", error); 
        // Ensure error status is passed to the central error handler if not already set
        if (!res.headersSent) {
             const statusCodeToUse = (error.status || (res.statusCode && res.statusCode >=400 ? res.statusCode : 500));
             next(Object.assign(error, { status: statusCodeToUse }));
        } else {
            console.error("Headers were already sent for downloadTicketReport. Cannot send JSON error.");
            if (!res.writableEnded) { res.end(); }
        }
    }
});