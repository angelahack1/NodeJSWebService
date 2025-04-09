const express = require('express');
const bodyParser = require('body-parser');
const { parseString } = require('xml2js');
const xmlbuilder = require('xmlbuilder');

const app = express();
const port = 3000;

// Middleware to parse raw XML body
app.use(bodyParser.text({ type: 'text/xml' }));

// SOAP Endpoint
app.post('/soap', (req, res) => {
    const xmlRequest = req.body;

    parseString(xmlRequest, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error parsing XML');
        }

        // Extract the SOAP method/action (example: GetUser)
        const soapAction = result['soapenv:Envelope']['soapenv:Body'][0]['soap:GetUser'][0];
        const userId = soapAction.userId[0];

        // Business logic (mock response)
        const userName = `User_${userId}`;

        // Build SOAP response
        const xmlResponse = xmlbuilder.create({
            'soapenv:Envelope': {
                '@xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
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
    });
});

app.listen(port, () => {
    console.log(`SOAP server running at http://localhost:${port}/soap`);
});