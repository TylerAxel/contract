class UPSService {
    static GROUND = { code: 'GND', name: 'UPS Ground' };
    static THREE_DAY = { code: '3DS', name: 'UPS 3 Day Select' };
    static TWO_DAY = { code: '2DA', name: 'UPS 2nd Day Air' };
    static NEXT_DAY = { code: '1DA', name: 'UPS Next Day Air' };
    static NEXT_DAY_EARLY = { code: '1DM', name: 'UPS Next Day Air Early' };
    static NEXT_DAY_SAVER = { code: '1DP', name: 'UPS Next Day Air Saver' };

    static getAllServices() {
        return [
            this.GROUND,
            this.THREE_DAY,
            this.TWO_DAY,
            this.NEXT_DAY,
            this.NEXT_DAY_EARLY,
            this.NEXT_DAY_SAVER
        ];
    }
}

class ShippingCalculator {
    constructor() {
        this.upsClientId = 'gIwq9XE7Xvl2AGkW20F61eMuo9OO40rAGWwUIkthEbiEDyUI';
        this.upsClientSecret = '3TLuzNtYr46DEqSMCzVNcxPAGtlXq8oGaVhnFxQd5F6ANZbkEM080hoQbDYE3d0B';
        this.baseURL = 'https://onlinetools.ups.com'; // Change to production URL when ready
        this.accessToken = null;
        this.tokenExpirationDate = null;
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpirationDate > new Date()) {
            return this.accessToken;
        }

        const credentials = btoa(`${this.upsClientId}:${this.upsClientSecret}`);
        const response = await fetch(`${this.baseURL}/security/v1/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            },
            body: 'grant_type=client_credentials'
        });

        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpirationDate = new Date(Date.now() + data.expires_in * 1000);
        return this.accessToken;
    }

    async calculateTransitTime(originZip, destinationZip, service, shipDate, isResidential) {
        try {
            const token = await this.getAccessToken();
            
            const requestBody = {
                originCountryCode: 'US',
                originPostalCode: originZip,
                destinationCountryCode: 'US',
                destinationPostalCode: destinationZip,
                weight: '1.0',
                weightUnitOfMeasure: 'LBS',
                shipmentContentsValue: '1.0',
                shipmentContentsCurrencyCode: 'USD',
                billType: '03',
                shipDate: this.formatDate(shipDate),
                shipTime: '1000',
                residentialIndicator: isResidential ? '01' : '02',
                numberOfPackages: '1'
            };

            const response = await fetch(`${this.baseURL}/api/shipments/v1/transittimes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'transId': crypto.randomUUID(),
                    'transactionSrc': 'testing'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            return this.processResponse(data, service);
        } catch (error) {
            console.error('Error calculating transit time:', error);
            throw error;
        }
    }

    processResponse(data, selectedService) {
        if (data.emsResponse) {
            const matchingService = data.emsResponse.services.find(
                s => s.serviceLevel === selectedService.code
            );

            if (matchingService) {
                return {
                    transitDays: matchingService.businessTransitDays,
                    deliveryDate: matchingService.deliveryDate,
                    deliveryTime: matchingService.deliveryTime,
                    deliveryDayOfWeek: matchingService.deliveryDayOfWeek,
                    serviceLevelDescription: matchingService.serviceLevelDescription,
                    destinationCity: data.emsResponse.destinationCityName,
                    destinationState: data.emsResponse.destinationStateProvince
                };
            }
        }
        return null;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
} 