import { useEffect, useMemo, useState } from 'react';
import { FiMapPin, FiRefreshCw } from 'react-icons/fi';
import RecyclingCenterCard from '../components/RecyclingCenterCard';
import MapView from '../components/MapView';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorCard from '../components/ErrorCard';
import { useWaste } from '../hooks/useWaste';
import { getRecyclingCenters } from '../services/api';
import { getTopWasteType } from '../utils/waste';

export default function RecyclingCenters() {
  const { state, dispatch } = useWaste();
  const [requestState, setRequestState] = useState('idle');
  const [locationError, setLocationError] = useState(null);
  const wasteType = useMemo(() => getTopWasteType(state.detections) || state.analysis?.mostDetected || '', [state.analysis?.mostDetected, state.detections]);
  const userLocation = state.location;

  const fetchCenters = async (location) => {
    if (!location) return;
    try {
      dispatch({ type: 'SET_LOADING', key: 'centers', value: true });
      dispatch({ type: 'SET_ERROR', key: 'centers', value: null });
      const response = await getRecyclingCenters({
        latitude: location.latitude,
        longitude: location.longitude,
        wasteType,
      });
      dispatch({ type: 'SET_RECYCLING_CENTERS', payload: response.centers || [] });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        key: 'centers',
        value: error instanceof Error ? error.message : 'Could not load centers.',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'centers', value: false });
    }
  };

  const requestLocation = () => {
    setLocationError(null);
    dispatch({ type: 'SET_RECYCLING_CENTERS', payload: [] });
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not available in this browser.');
      return;
    }

    setRequestState('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        dispatch({ type: 'SET_LOCATION', payload: location });
        setRequestState('granted');
      },
      (error) => {
        setLocationError(error.message || 'Location permission was denied.');
        dispatch({ type: 'SET_RECYCLING_CENTERS', payload: [] });
        setRequestState('denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchCenters(userLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.latitude, userLocation?.longitude, wasteType]);

  const centers = state.recyclingCenters || [];

  return (
    <section className="page-shell section-shell">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Recycling Centers</p>
          <h1 className="soft-heading mt-2 text-4xl text-slate-900">Find nearby recycling centers and map them</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            We request browser geolocation, fetch centers from the backend, and render them both as cards and map markers.
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={requestLocation}>
          <FiRefreshCw />
          Refresh location
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Location</p>
          <p className="mt-3 text-lg font-bold text-slate-900">
            {requestState === 'requesting' ? 'Requesting permission...' : userLocation ? 'Location granted' : 'Location unavailable'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {locationError || 'The browser permission prompt controls this step.'}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Target waste type</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{wasteType || 'General recycling'}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Used to refine the search keywords sent to the backend.</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Centers found</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{centers.length}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Sorted by distance and shown with map links.</p>
        </div>
      </div>

      {(locationError && !userLocation) ? (
        <div className="mt-6">
          <ErrorCard
            title="Location denied"
            message={locationError}
            onRetry={requestLocation}
            retryLabel="Request location again"
          />
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <MapView userLocation={userLocation} centers={centers} />
        <div className="grid gap-4">
          {centers.length > 0 ? centers.map((center) => (
            <RecyclingCenterCard
              key={`${center.name}-${center.distance}`}
              center={{
                ...center,
                wasteTypes: center.wasteTypes || [wasteType || 'Recycling'],
              }}
            />
          )) : (
            <div className="glass-card flex min-h-[24rem] items-center justify-center p-6 text-center">
              <div>
                <FiMapPin className="mx-auto text-3xl text-emerald-600" />
                <p className="mt-4 text-lg font-bold text-slate-900">No recycling centers found yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Once location is available, the backend search results will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {state.loading.centers ? <LoadingSpinner label="Finding recycling centers..." fullScreen /> : null}
      {state.errors.centers ? (
        <div className="mt-8">
          <ErrorCard message={state.errors.centers} />
        </div>
      ) : null}
    </section>
  );
}
