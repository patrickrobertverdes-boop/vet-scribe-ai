const { DBFFile } = require('dbffile');
const path = require('path');
const fs = require('fs');

async function createMockData() {
    const dataDir = path.join(__dirname, '../mock_avimark/Data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log('Creating mock Avimark DBF files...');

    const cleanup = (files) => {
        files.forEach(f => {
            const p = path.join(dataDir, f);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        });
    };
    cleanup(['Client.dbf', 'Patient.dbf', 'Schedule.dbf']);

    // 1. Client.dbf
    const clientFields = [
        { name: 'CLIENT_ID', type: 'C', size: 10 },
        { name: 'FIRST_NAME', type: 'C', size: 50 },
        { name: 'LAST_NAME', type: 'C', size: 50 },
        { name: 'PHONE', type: 'C', size: 20 },
        { name: 'EMAIL', type: 'C', size: 100 }
    ];

    try {
        const clientDBF = await DBFFile.create(path.join(dataDir, 'Client.dbf'), clientFields);
        await clientDBF.appendRecords([
            { CLIENT_ID: 'CL001', FIRST_NAME: 'John', LAST_NAME: 'Doe', PHONE: '555-0101', EMAIL: 'john.doe@example.com' },
            { CLIENT_ID: 'CL002', FIRST_NAME: 'Jane', LAST_NAME: 'Smith', PHONE: '555-0102', EMAIL: 'jane.smith@example.com' }
        ]);
        console.log('✅ Created Client.dbf');
    } catch (err) {
        console.error('Error creating Client.dbf:', err);
    }

    // 2. Patient.dbf
    const patientFields = [
        { name: 'PATIENT_ID', type: 'C', size: 10 },
        { name: 'NAME', type: 'C', size: 50 },
        { name: 'SPECIES', type: 'C', size: 20 },
        { name: 'BREED', type: 'C', size: 50 },
        { name: 'BIRTHDATE', type: 'D', size: 8 },
        { name: 'CLIENT_ID', type: 'C', size: 10 }
    ];

    try {
        const patientDBF = await DBFFile.create(path.join(dataDir, 'Patient.dbf'), patientFields);
        await patientDBF.appendRecords([
            // Pass Date objects for 'D' fields
            { PATIENT_ID: 'P001', NAME: 'Buddy', SPECIES: 'Canine', BREED: 'Golden Retriever', BIRTHDATE: new Date('2018-01-01'), CLIENT_ID: 'CL001' },
            { PATIENT_ID: 'P002', NAME: 'Mittens', SPECIES: 'Feline', BREED: 'Tabby', BIRTHDATE: new Date('2019-05-15'), CLIENT_ID: 'CL002' },
            { PATIENT_ID: 'P003', NAME: 'Rex', SPECIES: 'Canine', BREED: 'German Shepherd', BIRTHDATE: new Date('2020-11-20'), CLIENT_ID: 'CL001' }
        ]);
        console.log('✅ Created Patient.dbf');
    } catch (err) {
        console.error('Error creating Patient.dbf:', err);
    }

    // 3. Schedule.dbf (Calendar)
    const scheduleFields = [
        { name: 'APPT_ID', type: 'C', size: 10 },
        { name: 'PATIENT_ID', type: 'C', size: 10 },
        { name: 'START_TIME', type: 'D', size: 8 },
        { name: 'NOTE', type: 'C', size: 100 },
        { name: 'STATUS', type: 'C', size: 20 }
    ];

    try {
        const schedDBF = await DBFFile.create(path.join(dataDir, 'Schedule.dbf'), scheduleFields);
        await schedDBF.appendRecords([
            { APPT_ID: 'A001', PATIENT_ID: 'P001', START_TIME: new Date('2023-10-27'), NOTE: 'Annual Checkup', STATUS: 'Scheduled' },
            { APPT_ID: 'A002', PATIENT_ID: 'P002', START_TIME: new Date('2023-10-28'), NOTE: 'Vaccination', STATUS: 'Completed' }
        ]);
        console.log('✅ Created Schedule.dbf');
    } catch (err) {
        console.error('Error creating Schedule.dbf:', err);
    }
}

createMockData();
