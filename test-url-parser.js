const testCases = [
        {
                description: 'Google Docs URL (real user example)',
                url: 'https://docs.google.com/document/d/1EIas5pt880iTnQANdEZ_u2FsK9P3Uw19CZdOsee6txk/edit?tab=t.0#heading=h.l8dsnaj175dw',
                expected: '1EIas5pt880iTnQANdEZ_u2FsK9P3Uw19CZdOsee6txk',
        },
        {
                description: 'Google Docs URL with domain scope',
                url: 'https://docs.google.com/a/example.com/document/d/1domain123-ABC_xyz/edit',
                expected: '1domain123-ABC_xyz',
        },
        {
                description: 'Google Sheets URL',
                url: 'https://docs.google.com/spreadsheets/d/1abc123XYZ-_456/edit#gid=0',
                expected: '1abc123XYZ-_456',
        },
        {
                description: 'Google Slides URL',
                url: 'https://docs.google.com/presentation/d/1xyz789ABC-_012/edit#slide=id.p',
                expected: '1xyz789ABC-_012',
        },
        {
                description: 'Google Forms URL with /d/e/ pattern',
                url: 'https://docs.google.com/forms/d/e/1FAIpQLSform123ABC-_xyz/viewform',
                expected: '1FAIpQLSform123ABC-_xyz',
        },
        {
                description: 'Google Forms URL with user scope and /d/e/ pattern',
                url: 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSuser123-ABC_xyz/viewform',
                expected: '1FAIpQLSuser123-ABC_xyz',
        },
        {
                description: 'Google Forms edit URL',
                url: 'https://docs.google.com/forms/d/1form456-XYZ_abc/edit',
                expected: '1form456-XYZ_abc',
        },
        {
                description: 'Google Drive file URL',
                url: 'https://drive.google.com/file/d/1drive789-ABC_xyz/view',
                expected: '1drive789-ABC_xyz',
        },
        {
                description: 'Google Drive file URL with user scope',
                url: 'https://drive.google.com/u/0/file/d/1userfile123-ABC_xyz/view',
                expected: '1userfile123-ABC_xyz',
        },
        {
                description: 'Google Drive open URL',
                url: 'https://drive.google.com/open?id=1param123-XYZ_abc',
                expected: '1param123-XYZ_abc',
        },
        {
                description: 'Direct file ID',
                url: '1direct789-ABC_xyz',
                expected: '1direct789-ABC_xyz',
        },
        {
                description: 'Google Drive folder URL',
                url: 'https://drive.google.com/drive/folders/1folder123-ABC_xyz',
                expected: '1folder123-ABC_xyz',
        },
        {
                description: 'Google Drive folder URL with user scope',
                url: 'https://drive.google.com/drive/u/0/folders/1userfolder123-ABC_xyz',
                expected: '1userfolder123-ABC_xyz',
        },
        {
                description: 'Invalid URL - wrong domain',
                url: 'https://example.com/d/1wrong123-ABC_xyz',
                expected: null,
        },
        {
                description: 'Invalid URL - missing /d/ segment',
                url: 'https://docs.google.com/document/1wrong456-XYZ_abc',
                expected: null,
        },
        {
                description: 'Invalid URL - completely unrelated',
                url: 'https://notgoogle.com/random/path',
                expected: null,
        },
        {
                description: 'Invalid URL - wrong Google subdomain',
                url: 'https://mail.google.com/d/1wrong789',
                expected: null,
        },
];

function extractFileIdFromUrl(input) {
        const idPattern = /^[a-zA-Z0-9_-]+$/;
        if (idPattern.test(input)) {
                return input;
        }

        const idParamMatch = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idParamMatch) {
                return idParamMatch[1];
        }

        const foldersMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        if (foldersMatch) {
                return foldersMatch[1];
        }

        try {
                const urlObj = new URL(input);
                
                if (!['docs.google.com', 'drive.google.com'].includes(urlObj.hostname)) {
                        return null;
                }

                const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
                
                const dIndex = pathSegments.indexOf('d');
                if (dIndex !== -1 && dIndex < pathSegments.length - 1) {
                        const nextSegment = pathSegments[dIndex + 1];
                        
                        if (nextSegment === 'e' && dIndex < pathSegments.length - 2) {
                                return pathSegments[dIndex + 2];
                        }
                        
                        return nextSegment;
                }
        } catch (e) {
                return null;
        }

        return null;
}

console.log('Running URL Parser Tests...\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
        const result = extractFileIdFromUrl(test.url);
        const success = result === test.expected;
        
        if (success) {
                console.log(`✅ Test ${index + 1}: ${test.description}`);
                passed++;
        } else {
                console.log(`❌ Test ${index + 1}: ${test.description}`);
                console.log(`   URL: ${test.url}`);
                console.log(`   Expected: ${test.expected}`);
                console.log(`   Got: ${result}`);
                failed++;
        }
});

console.log(`\n${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed > 0) {
        process.exit(1);
}
