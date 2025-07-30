# Fire Watch APIs for New Brunswick, Canada

The landscape of fire monitoring APIs offers robust options for New Brunswick coverage, with Canadian government sources providing comprehensive national data and US agencies extending coverage across North America. **NASA FIRMS emerges as the gold standard for satellite-based fire detection**, while **Canada's CWFIS system provides the most authoritative domestic fire information**. Commercial providers offer value-added services but typically require paid subscriptions for full access.

This analysis identifies 15+ distinct API sources, ranging from free government services to commercial platforms, with varying levels of technical sophistication and data coverage. The Canadian government provides the most comprehensive free access through CWFIS, while NASA FIRMS offers superior satellite-based detection with ultra-real-time data for North American coverage.

## Primary Government Sources (Recommended)

### Canadian Wildland Fire Information System (CWFIS)
**The definitive Canadian fire monitoring system** operated by Natural Resources Canada provides comprehensive coverage of New Brunswick and all Canadian provinces.

- **API Endpoints**: `https://cwfis.cfs.nrcan.gc.ca/geoserver/ows` (WMS service)
- **Documentation**: Complete technical specifications at cwfis.cfs.nrcan.gc.ca/datamart
- **Geographic Coverage**: Canada-wide including New Brunswick with provincial integration
- **Data Types**: Active wildland fires (daily updates), Fire M3 Hotspots, fire perimeter estimates, Fire Weather Index system components, fire danger ratings, historical National Fire Database since 1972
- **Authentication**: None required - Open Government Licence Canada
- **Rate Limits**: None specified for reasonable use
- **Data Formats**: WMS imagery, geospatial standards (OGC compliant), bulk data via request forms
- **Update Frequency**: Daily for active fires, real-time during fire season
- **Cost**: **Completely free**
- **Key Strength**: Official Canadian government data with complete provincial integration

### NASA FIRMS (Fire Information for Resource Management System) 
**The global leader in satellite fire detection** with explicit North American focus provides superior coverage extending into Canada.

- **API Endpoints**: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{source}/{area}/{days}`
- **Documentation**: Comprehensive API documentation with examples
- **Geographic Coverage**: Global with specialized US/Canada portal for enhanced coverage
- **Data Types**: MODIS (1km resolution) and VIIRS (375m resolution) active fire detections, ultra-real-time data (<60 seconds for US/Canada), fire radiative power measurements
- **Authentication**: Free MAP_KEY registration required
- **Rate Limits**: 5,000 transactions per 10-minute interval
- **Data Formats**: CSV, JSON, KML, SHP, TXT
- **Update Frequency**: <60 seconds ultra-real-time for North America, <3 hours globally
- **Cost**: **Completely free**
- **Key Strength**: Highest resolution satellite data with fastest updates for North American coverage

### Environment and Climate Change Canada (ECCC) GeoMet
**Canada's meteorological data platform** supporting fire weather applications nationwide.

- **API Endpoints**: `https://api.weather.gc.ca/` with OGC-compliant services
- **Documentation**: Comprehensive at eccc-msc.github.io/open-data/msc-geomet/
- **Geographic Coverage**: Canada-wide meteorological support
- **Data Types**: Fire weather forecasts, climate data, weather supporting fire danger calculations
- **Authentication**: Anonymous access, no API keys
- **Data Formats**: JSON, JSON-LD, HTML, OGC standards
- **Update Frequency**: Real-time weather data, 24/7 operations
- **Cost**: **Completely free**
- **Key Strength**: Official weather data supporting fire danger analysis

## US Government APIs with Canadian Coverage

### NOAA Hazard Mapping System (HMS)
**North America's comprehensive fire and smoke detection system** extends coverage into Canadian territories.

- **API Endpoints**: WFS services for fire and smoke layers
- **Documentation**: Available at ospo.noaa.gov/products/land/hms.html
- **Geographic Coverage**: North America, Hawaii, Caribbean including Canada
- **Data Types**: Multi-satellite active fire detections (GOES, VIIRS, MODIS, AVHRR), smoke plume mapping with density classifications, fire radiative power
- **Authentication**: Public WFS access
- **Data Formats**: KML, shapefile, WFS, text products
- **Update Frequency**: Daily initial product (8-10 AM Eastern), continuous updates
- **Cost**: **Completely free**
- **Key Strength**: Excellent smoke plume data extending into Canada

### EPA AirNow API
**Air quality monitoring** with explicit Canada, US, and Mexico coverage for smoke-related air quality data.

- **API Endpoints**: Documented at docs.airnowapi.org
- **Geographic Coverage**: Canada, United States, Mexico
- **Data Types**: Air Quality Index data, PM2.5 concentrations from smoke, fire and smoke map integration
- **Authentication**: Free account registration
- **Update Frequency**: Real-time observations, daily forecasts
- **Cost**: **Completely free**
- **Key Strength**: Smoke impact assessment with Canadian station coverage

## Commercial API Options

### Ambee Wildfire API
**Real-time commercial wildfire intelligence** with high spatial resolution and forecasting capabilities.

- **Geographic Coverage**: US and Canada comprehensive coverage
- **Data Types**: Hourly wildfire updates, 4-week advance forecasts (96% accuracy), 500m resolution risk maps
- **Technical Specs**: 1x1 km grid resolution, REST API, JSON format
- **Pricing**: Free tier available, enterprise pricing on contact
- **Key Strength**: High-resolution forecasting with machine learning

### XWeather Fire API  
**Commercial weather platform** with detailed wildfire data for North American coverage.

- **API Endpoints**: `https://data.api.xweather.com/fires/{action}`
- **Geographic Coverage**: US and Canada wildfire data
- **Data Types**: Active wildfires with containment percentages, fire perimeters (GeoJSON), area measurements, fire causes and expected containment dates
- **Data Sources**: NIFC (National Interagency Fire Center)
- **Pricing**: Subscription-based (contact required)
- **Key Strength**: Detailed commercial fire intelligence with perimeter mapping

### OpenWeatherMap Fire Weather Index
**Global weather platform** with Canadian Forest Service Fire Weather Index implementation.

- **API Endpoints**: Current and 5-day forecast Fire Weather Index
- **Geographic Coverage**: Global including Canada
- **Data Types**: Fire Weather Index values, danger ratings (Very Low to Extreme), based on Canadian Forest Service system
- **Authentication**: API key required
- **Pricing**: Contact for Fire Weather Index access
- **Key Strength**: Standardized Canadian fire danger rating system

## New Brunswick Provincial Coverage

### New Brunswick Fire Services Integration
- **GIS Service**: ArcGIS MapServer at gis-erd-der.gnb.ca for provincial fire locations
- **Data Sharing**: Participates in national Data Integration Project through Canadian Interagency Forest Fire Centre
- **Coverage**: New Brunswick-specific fire districts and active locations
- **Integration**: Feeds data into national CWFIS system

The province integrates with federal systems, making CWFIS the primary access point for comprehensive New Brunswick fire data rather than maintaining separate public APIs.

## Technical Integration Specifications

### Recommended Data Formats
- **GeoJSON**: Primary format for fire perimeters and locations (supported by NASA FIRMS, commercial APIs)
- **CSV**: Optimal for bulk data processing and analysis (NASA FIRMS standard export)
- **JSON**: Standard for REST API responses across most services
- **WMS**: Web Map Service integration for GIS applications (CWFIS standard)

### Authentication Patterns
- **API Keys**: NASA FIRMS (free MAP_KEY registration), commercial services
- **Open Access**: CWFIS, ECCC GeoMet, NOAA HMS (no authentication)
- **Account Registration**: EPA AirNow (free registration), commercial platforms

### Rate Limiting Guidelines
- **NASA FIRMS**: 5,000 transactions per 10-minute interval
- **Government APIs**: Generally unlimited for reasonable use
- **Commercial APIs**: Varies by subscription tier
- **Best Practice**: Implement caching with 15-30 minute refresh cycles

### Data Quality Considerations
**Confidence Thresholds**: Use >70% confidence for operational decisions with satellite data. **Source Hierarchy**: Ground reports > VIIRS (375m) > MODIS (1km) > model estimates. **Update Latencies**: Ultra-real-time (<60 seconds) available for North America via NASA FIRMS, standard global coverage 1-3 hours.

## Implementation Recommendations for New Brunswick

### Primary API Strategy (Free Tier)
1. **NASA FIRMS** as primary satellite detection source for real-time fire locations
2. **CWFIS Datamart** for comprehensive Canadian fire intelligence and historical data  
3. **ECCC GeoMet** for supporting weather data and fire weather indices
4. **NOAA HMS** for smoke plume analysis extending into Canadian territory

### Enhanced Commercial Integration
Add **Ambee Wildfire API** (free tier) for high-resolution forecasting and **XWeather** for detailed perimeter data if budget permits commercial subscriptions.

### Technical Architecture Pattern
Implement data fusion approach combining NASA FIRMS satellite detection with CWFIS official incident data, using ECCC weather data for fire danger context. Cache responses for 15-30 minutes to optimize performance while maintaining near-real-time capabilities.

The combination of free government APIs provides comprehensive coverage for New Brunswick fire monitoring without commercial subscription requirements, while maintaining access to the highest quality satellite detection and official incident data available globally.

## Conclusion

New Brunswick fire monitoring benefits from exceptional government API coverage through both Canadian and US federal sources. **CWFIS provides the most authoritative Canadian fire data**, while **NASA FIRMS offers superior satellite detection technology**. The combination of these free government APIs delivers professional-grade fire monitoring capabilities without subscription costs, supplemented by commercial options for enhanced features when needed.

Most APIs support standard web technologies (REST, JSON, GeoJSON) with reasonable rate limits suitable for operational applications. The maturity of government fire monitoring systems ensures reliable, long-term data access for both real-time monitoring and historical analysis applications.