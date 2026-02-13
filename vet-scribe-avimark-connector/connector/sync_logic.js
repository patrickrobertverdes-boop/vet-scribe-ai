const { DBFFile } = require('dbffile');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

class BridgeSync {
    constructor(shadowDir, apiBaseUrl, apiKey) {
        this.shadowDir = shadowDir;
        this.apiBaseUrl = apiBaseUrl || 'http://localhost:3000/api/bridge';
        this.apiKey = apiKey || 'dev_key';
    }

    async syncPatients() {
        console.log('🔄 Syncing Patients...');
        const patientPath = path.join(this.shadowDir, 'Patient.dbf');
        const clientPath = path.join(this.shadowDir, 'Client.dbf');

        if (!fs.existsSync(patientPath)) {
            console.warn('⚠️ Patient.dbf not found in shadow dir.');
            return;
        }

        try {
            const dbf = await DBFFile.open(patientPath);
            const records = await dbf.readRecords(100); // Limit to 100 for dev

            // Map to our app schema
            const mappedPatients = records.map(r => ({
                externalId: r.PATIENT_ID,
                name: r.NAME ? r.NAME.trim() : '',
                species: r.SPECIES ? r.SPECIES.trim() : '',
                breed: r.BREED ? r.BREED.trim() : '',
                birthDate: r.BIRTHDATE, // Date object
                ownerId: r.CLIENT_ID
            }));

            // Send to API
            await this.sendToApi('/patients', { patients: mappedPatients });
            console.log(`✅ Synced ${mappedPatients.length} patients.`);
        } catch (err) {
            console.error('❌ Error syncing patients:', err.message);
        }
    }

    async syncCalendar() {
        console.log('🔄 Syncing Calendar...');
        const schedPath = path.join(this.shadowDir, 'Schedule.dbf');

        if (!fs.existsSync(schedPath)) {
            console.warn('⚠️ Schedule.dbf not found in shadow dir.');
            return;
        }

        try {
            const dbf = await DBFFile.open(schedPath);
            const records = await dbf.readRecords(100);

            const mappedEvents = records.map(r => ({
                externalId: r.APPT_ID,
                patientId: r.PATIENT_ID,
                start: r.START_TIME, // Date object
                title: r.NOTE ? r.NOTE.trim() : 'Appointment',
                status: r.STATUS ? r.STATUS.trim() : 'Scheduled'
            }));

            await this.sendToApi('/calendar', { events: mappedEvents });
            console.log(`✅ Synced ${mappedEvents.length} calendar events.`);
        } catch (err) {
            console.error('❌ Error syncing calendar:', err.message);
        }
    }

    async checkForExports() {
        // Poll API for pending writes (e.g. new appointments created in Web App)
        console.log('📥 Checking for pending exports from Cloud...');
        try {
            const response = await axios.get(`${this.apiBaseUrl}/pending-exports`, { headers: { 'x-api-key': this.apiKey } });
            const commands = response.data.commands;

            if (commands && commands.length > 0) {
                console.log(`⚡ Found ${commands.length} pending commands.`);
                for (const cmd of commands) {
                    await this.processCommand(cmd);
                }
            } else {
                console.log('No pending commands from cloud.');
            }
        } catch (err) {
            console.error('❌ Error checking exports:', err.message);
        }
    }

    async processCommand(cmd) {
        console.log(`⚙️ Processing Command: ${cmd.type}`, cmd.payload);
        // Implementation for write-back would go here.
        // SAFE MODE: Write to an import file.
        // RISKY MODE: Direct DBF update.

        const importDir = path.join(this.shadowDir, '../import_queue');
        if (!fs.existsSync(importDir)) fs.mkdirSync(importDir, { recursive: true });

        const filename = `cmd_${Date.now()}_${cmd.type}.json`;
        fs.writeFileSync(path.join(importDir, filename), JSON.stringify(cmd, null, 2));
        console.log(`✅ Command saved to import queue: ${filename}`);
    }

    async sendToApi(endpoint, payload) {
        // For development, we might not have the server running, so we'll log.
        // If the server IS running, we try to post.
        try {
            console.log(`📡 POST ${this.apiBaseUrl}${endpoint}`);
            await axios.post(`${this.apiBaseUrl}${endpoint}`, payload, { headers: { 'x-api-key': this.apiKey } });
            console.log(`✅ Sent ${endpoint} data to API.`);
        } catch (err) {
            console.error(`❌ API Error (${endpoint}):`, err.message);
        }
    }
}

module.exports = BridgeSync;
