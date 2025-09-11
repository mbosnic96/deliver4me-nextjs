import { Country, State, City } from 'country-state-city';


const cache = {
  countries: null as any[] | null,
  states: new Map<string, any[]>(),
  cities: new Map<string, any[]>(),
};


export const getCountries = () => {
  if (!cache.countries) {
    cache.countries = Country.getAllCountries().map((country) => ({
      label: country.name,
      value: country.isoCode,
      phonecode: country.phonecode,
      flag: country.flag,
    }));
  }
  return cache.countries;
};

export const getStates = (countryCode: string) => {
  if (!countryCode) return [];
  
  const cacheKey = countryCode;
  if (!cache.states.has(cacheKey)) {
    const states = State.getStatesOfCountry(countryCode);
    if (!states || states.length === 0) {
      cache.states.set(cacheKey, []);
      return [];
    }
    
    cache.states.set(
      cacheKey,
      states.map((state) => ({
        label: state.name,
        value: state.isoCode,
      }))
    );
  }
  
  return cache.states.get(cacheKey) || [];
};

export const getCities = (countryCode: string, stateCode: string) => {
  if (!countryCode || !stateCode) return [];
  
  const cacheKey = `${countryCode}-${stateCode}`;
  if (!cache.cities.has(cacheKey)) {
    const cities = City.getCitiesOfState(countryCode, stateCode);
    if (!cities || cities.length === 0) {
      cache.cities.set(cacheKey, []);
      return [];
    }
    
    cache.cities.set(
      cacheKey,
      cities.map((city) => ({
        label: city.name,
        value: city.name,
      }))
    );
  }
  
  return cache.cities.get(cacheKey) || [];
};

const geocodeCache = new Map<string, { lat: number; lng: number }>();
let lastGeocodeRequest = 0;

export async function getCityLatLng(
  cityName: string,
  countryCode?: string,
  stateCode?: string
): Promise<{ lat: number; lng: number } | null> {
  const cacheKey = `${cityName}-${countryCode}-${stateCode}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) || null;
  }

  const now = Date.now();
  const timeSinceLastRequest = now - lastGeocodeRequest;
  if (timeSinceLastRequest < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - timeSinceLastRequest));
  }

  try {
    let query = cityName;
    if (countryCode) query += `, ${countryCode}`;
    if (stateCode) query += `, ${stateCode}`;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&addressdetails=1&limit=1`
    );

    lastGeocodeRequest = Date.now();

    if (!res.ok) {
      throw new Error(`Geocoding failed with status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch city coordinates:', error);
    return null;
  }
}

export const getCountryName = (countryCode: string) => {
  const country = Country.getCountryByCode(countryCode);
  return country ? country.name : countryCode;
};

export const getStateName = (countryCode: string, stateCode: string) => {
  const state = State.getStateByCodeAndCountry(stateCode, countryCode);
  return state ? state.name : stateCode;
};

export const getCityName = (cityName: string) => {
  return cityName; 
};