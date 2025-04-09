const express = require('express');
const bodyParser = require('body-parser');
const { parseString } = require('xml2js');
const xmlbuilder = require('xmlbuilder');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000; // Changed to 8080 as per your example

// Middleware to parse raw XML body
app.use(bodyParser.text({ type: 'text/xml' }));

// Serve WSDL at /soap?wsdl
app.get('/soap', (req, res) => {
    // Only serve WSDL if ?wsdl parameter exists
    if (Object.keys(req.query).includes('wsdl')) {
        const wsdlPath = path.join(__dirname, 'service.wsdl');
        fs.readFile(wsdlPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading WSDL file:', err);
                return res.status(500).send('Error reading WSDL file');
            }
            res.set('Content-Type', 'text/xml');
            res.send(data);
        });
    } else {
        // For GET requests without ?wsdl
        res.status(200).send('SOAP Service Endpoint. Use ?wsdl to get WSDL definition.');
    }
});

// SOAP Endpoint (POST requests)
app.post('/soap', (req, res) => {
    const xmlRequest = req.body;

    parseString(xmlRequest, (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return res.status(500).send('Error parsing XML');
        }

        try {
            // Handle both 'soapenv:' and 'soap:' prefixes
            const envelope = result['soapenv:Envelope'] || result['soap:Envelope'];
            const body = envelope['soapenv:Body'] || envelope['soap:Body'];
            const soapAction = body[0]['GetUser'] || body[0]['soap:GetUser'];
            const userId = soapAction[0].userId[0];

            // Business logic
            const userName = `User_${userId}`;

            // Build SOAP response
            const xmlResponse = xmlbuilder.create({
                'soapenv:Envelope': {
                    '@xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
                    'soapenv:Body': {
                        'GetUserResponse': {
                            '@xmlns': 'http://example.com/soap-service',
                            'user': {
                                'id': userId,
                                'name': userName
                            }
                        }
                    }
                }
            }).end({ pretty: true });

            res.set('Content-Type', 'text/xml');
            res.send(xmlResponse);
        } catch (error) {
            console.error('Error processing SOAP request:', error);
            res.status(400).send('Invalid SOAP request format');
        }
    });
});

app.listen(port, () => {
    console.log(`SOAP server running at http://localhost:${port}/soap`);
});