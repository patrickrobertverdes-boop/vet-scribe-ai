const { DBFFile } = require('dbffile');
const path = require('path');

async function inspect() {
    const files = ['Patient.dbf', 'Client.dbf'];
    const dir = path.join(__dirname, '../mock_avimark/Data');

    for (const f of files) {
        try {
            const dbf = await DBFFile.open(path.join(dir, f));
            console.log(`\n--- ${f} Structure ---`);
            console.log(`Field Count: ${dbf.fields.length}`);
            console.log('Fields:', dbf.fields.map(f => f.name).join(', '));
            console.log(`Record Count: ${dbf.recordCount}`);

            // Read first record to see sample data
            const records = await dbf.readRecords(1);
            if (records.length > 0) {
                console.log('Sample Record:', records[0]);
            }
        } catch (e) {
            console.error(`Error inspecting ${f}:`, e.message);
        }
    }
}

inspect();
