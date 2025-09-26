'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Country, State, City } from 'country-state-city';
import Select from 'react-select';

type FormData = {
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
  password: string;
  confirmPassword: string;
};

type SelectOption = {
  value: string;
  label: string;
};

export default function Register() {
  const router = useRouter();
  const [isDelivery, setIsDelivery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [stateOptions, setStateOptions] = useState<SelectOption[]>([]);
  const [cityOptions, setCityOptions] = useState<SelectOption[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>();

  const password = watch('password');
  const selectedCountry = watch('country');
  const selectedState = watch('state');

  useEffect(() => {
    const countries = Country.getAllCountries().map((country) => ({
      value: country.isoCode,
      label: country.name,
    }));
    setCountryOptions(countries);
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      const states = State.getStatesOfCountry(selectedCountry).map((state) => ({
        value: state.isoCode,
        label: state.name,
      }));
      setStateOptions(states);
      setCityOptions([]);
      setValue('state', '');
      setValue('city', '');
    }
  }, [selectedCountry, setValue]);

  useEffect(() => {
    if (selectedCountry && selectedState) {
      const cities = City.getCitiesOfState(selectedCountry, selectedState).map((city) => ({
        value: city.name,
        label: city.name,
      }));
      setCityOptions(cities);
      setValue('city', '');
    }
  }, [selectedCountry, selectedState, setValue]);

  const onCountrySelect = (selectedOption: SelectOption | null) => {
    if (selectedOption) {
      setValue('country', selectedOption.value);
    }
  };

  const onStateSelect = (selectedOption: SelectOption | null) => {
    if (selectedOption) {
      setValue('state', selectedOption.value);
    }
  };

  const onCitySelect = (selectedOption: SelectOption | null) => {
    if (selectedOption) {
      setValue('city', selectedOption.value);
    }
  };

const onSubmit: SubmitHandler<FormData> = async (data) => {
  try {
    setLoading(true);

    const payload = {
      ...data,
      role: isDelivery ? 'driver' : 'client',
    };

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Registration failed. Please try again.');
    }

    toast.success('Registration successful! Please login.');
    router.push('/login');
  } catch (error: any) {
    toast.error(error.message || 'Registration failed. Please try again.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen dark-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto content-bg rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="text-center mb-6">
            <img 
              src="/logo-light.png" 
              alt="Deliver4ME" 
              className="mx-auto h-12 w-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-light">Kreirajte račun</h2>
          </div>

          <div className="mb-6 text-center">
            <p className="mb-2 text-light">Ja sam:</p>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  !isDelivery
                    ? 'bg-blue-600 text-white'
                    : 'content-bg text-blue-600 border border-blue-600'
                }`}
                onClick={() => setIsDelivery(false)}
              >
                Klijent
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  isDelivery
                    ? 'bg-blue-600 text-white'
                    : 'content-bg text-blue-600 border border-blue-600'
                }`}
                onClick={() => setIsDelivery(true)}
              >
                Dostavljač
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-light">
                  Ime i prezime
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Ovo polje je obavezno!' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-light">
                  Korisničko ime
                </label>
                <input
                  id="username"
                  type="text"
                  {...register('username', { required: 'Ovo polje je obavezno!' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-light">
                  Telefon
                </label>
                <input
                  id="phone"
                  type="text"
                  {...register('phone', { required: 'Ovo polje je obavezno!' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-light">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Ovo polje je obavezno!',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Unesite validne podatke.'
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-light">
                  Država
                </label>
                <Select
                  id="country"
                  options={countryOptions}
                  onChange={onCountrySelect}
                  placeholder="Odaberite državu"
                  className="mt-1 basic-single"
                  classNamePrefix="select"
                  value={countryOptions.find(option => option.value === selectedCountry)}
                />
                <input
                  type="hidden"
                  {...register('country', { required: 'Ovo polje je obavezno!' })}
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-light">
                  Regija/Kanton
                </label>
                <Select
                  id="state"
                  options={stateOptions}
                  onChange={onStateSelect}
                  placeholder="Odaberite regiju"
                  className="mt-1 basic-single"
                  classNamePrefix="select"
                  isDisabled={!selectedCountry}
                  value={stateOptions.find(option => option.value === selectedState)}
                />
                <input
                  type="hidden"
                  {...register('state', { required: 'Ovo polje je obavezno!' })}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-light">
                  Grad
                </label>
                <Select
                  id="city"
                  options={cityOptions}
                  onChange={onCitySelect}
                  placeholder="Odaberite grad"
                  className="mt-1 basic-single"
                  classNamePrefix="select"
                  isDisabled={!selectedState}
                />
                <input
                  type="hidden"
                  {...register('city', { required: 'Ovo polje je obavezno!' })}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-light">
                  Poštanski broj
                </label>
                <input
                  id="postalCode"
                  type="text"
                  {...register('postalCode', { required: 'Ovo polje je obavezno!' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
                {errors.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-light">
                Adresa
              </label>
              <input
                id="address"
                type="text"
                {...register('address', { required: 'Ovo polje je obavezno!' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-light">
                Lozinka
              </label>
              <input
                id="password"
                type="password"
                {...register('password', { 
                  required: 'Ovo polje je obavezno!',
                  minLength: {
                    value: 8,
                    message: 'Lozinka mora imati bar 8 karaktera.'
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-light">
                Potvrdite lozinku
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', { 
                  required: 'Ovo polje je obavezno!',
                  validate: value => 
                    value === password || 'Lozinke se ne poklapaju!'
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Obrada...' : 'Registracija'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-light">
            <small>Već imate račun?</small>
            <a href="/login" className="ml-1 text-blue-600 hover:text-blue-500">
              Prijava
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}