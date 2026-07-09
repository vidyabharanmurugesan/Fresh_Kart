import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { FiMail, FiPhone, FiCalendar, FiMapPin, FiFileText, FiUpload, FiEdit2, FiCheck, FiX, FiUser, FiClock } from 'react-icons/fi';
import { MdStorefront, MdCategory, MdDirectionsBike } from 'react-icons/md';
import { authService } from '../../../services/authService';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../../../styles/dashboard.css';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

function LocationPickerMap({ value, onChange, onAddressResolve }) {
  const [position, setPosition] = useState([12.9716, 77.5946]); // Default to Bengaluru
  const [hasPosition, setHasPosition] = useState(false);

  useEffect(() => {
    if (value) {
      const parts = value.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          setPosition([lat, lng]);
          setHasPosition(true);
        }
      }
    }
  }, [value]);

  const handleResolveAddress = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const resolved = {
          current_address: data.display_name || '',
          city: addr.city || addr.town || addr.village || addr.suburb || '',
          state: addr.state || '',
          pin_code: addr.postcode || ''
        };
        if (onAddressResolve) {
          onAddressResolve(resolved);
        }
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setPosition([lat, lng]);
        setHasPosition(true);
        onChange(coords);
        handleResolveAddress(lat, lng);
      }
    });
    return null;
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setPosition([latitude, longitude]);
          setHasPosition(true);
          onChange(coords);
          handleResolveAddress(latitude, longitude);
        },
        (err) => {
          console.error('Error getting location:', err);
          alert('Could not retrieve current location. Please select it manually on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div style={{ marginTop: '10px', marginBottom: '15px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          style={{
            padding: '6px 12px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📍 Use Current Location
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
          Or click on the map to pin location
        </span>
      </div>
      <div style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents />
          <MapController position={position} />
          {hasPosition && <Marker position={position} />}
        </MapContainer>
      </div>
    </div>
  );
}


export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('basic');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [uploadingFields, setUploadingFields] = useState({
    shop_license_image: false,
    shop_logo: false,
    shop_front_image: false,
    shop_interior_image: false,
    shop_kitchen_image: false,
    cancelled_cheque_image: false,
    trademark_certificate: false,
    profile_photo: false,
    aadhaar_front_image: false,
    aadhaar_back_image: false,
    pan_card_image: false,
    live_selfie_image: false,
    driving_license_image: false,
    rc_book_image: false,
    vehicle_insurance_image: false
  });

  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    shop_name: '',
    shop_location: '',
    shop_license: '',
    shop_type: 'food',
    shop_license_image: '',
    shop_owner_name: '',
    shop_address: '',
    gps_location: '',
    aadhaar_card: '',
    pan_card: '',
    bank_account_details: '',
    shop_logo: '',
    shop_front_image: '',
    veg_nonveg: 'both',
    cuisine_type: '',
    operating_hours: '',
    shop_interior_image: '',
    shop_kitchen_image: '',
    gstin: '',
    cancelled_cheque_image: '',
    trademark_certificate: '',
    category_manager_approval: false,
    
    // Delivery fields
    profile_photo: '',
    aadhaar_front_image: '',
    aadhaar_back_image: '',
    pan_card_image: '',
    live_selfie_image: '',
    driving_license_number: '',
    driving_license_image: '',
    vehicle_type: 'bike',
    vehicle_number: '',
    rc_book_image: '',
    vehicle_insurance_image: '',
    current_address: '',
    city: '',
    state: '',
    pin_code: '',
    bank_account_holder_name: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    preferred_delivery_area: '',
    languages_known: '',
    work_type: 'full-time',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  });

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
        shop_name: user.shop_name || '',
        shop_location: user.shop_location || '',
        shop_license: user.shop_license || '',
        shop_type: user.shop_type || 'food',
        shop_license_image: user.shop_license_image || '',
        shop_owner_name: user.shop_owner_name || '',
        shop_address: user.shop_address || '',
        gps_location: user.gps_location || '',
        aadhaar_card: user.aadhaar_card || '',
        pan_card: user.pan_card || '',
        bank_account_details: user.bank_account_details || '',
        shop_logo: user.shop_logo || '',
        shop_front_image: user.shop_front_image || '',
        veg_nonveg: user.veg_nonveg || 'both',
        cuisine_type: user.cuisine_type || '',
        operating_hours: user.operating_hours || '',
        shop_interior_image: user.shop_interior_image || '',
        shop_kitchen_image: user.shop_kitchen_image || '',
        gstin: user.gstin || '',
        cancelled_cheque_image: user.cancelled_cheque_image || '',
        trademark_certificate: user.trademark_certificate || '',
        category_manager_approval: user.category_manager_approval || false,
        
        // Delivery fields
        profile_photo: user.profile_photo || '',
        aadhaar_front_image: user.aadhaar_front_image || '',
        aadhaar_back_image: user.aadhaar_back_image || '',
        pan_card_image: user.pan_card_image || '',
        live_selfie_image: user.live_selfie_image || '',
        driving_license_number: user.driving_license_number || '',
        driving_license_image: user.driving_license_image || '',
        vehicle_type: user.vehicle_type || 'bike',
        vehicle_number: user.vehicle_number || '',
        rc_book_image: user.rc_book_image || '',
        vehicle_insurance_image: user.vehicle_insurance_image || '',
        current_address: user.current_address || '',
        city: user.city || '',
        state: user.state || '',
        pin_code: user.pin_code || '',
        bank_account_holder_name: user.bank_account_holder_name || '',
        bank_name: user.bank_name || '',
        bank_account_number: user.bank_account_number || '',
        bank_ifsc_code: user.bank_ifsc_code || '',
        preferred_delivery_area: user.preferred_delivery_area || '',
        languages_known: user.languages_known || '',
        work_type: user.work_type || 'full-time',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
        emergency_contact_relationship: user.emergency_contact_relationship || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
    setError('');
  };

  const [downloadingLicense, setDownloadingLicense] = useState(false);

  const handleDownloadFreshkartLicense = async () => {
    setDownloadingLicense(true);
    setError('');
    setSuccess('');
    try {
      const blob = await authService.downloadLicense();
      const safeShopName = (user?.shop_name || 'shop').replace(/\s+/g, '_').toLowerCase();
      const filename = `freshkart_license_${safeShopName}.pdf`;
      
      const fileBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 200);
      
      setSuccess('FreshKart License Certificate downloaded successfully!');
    } catch (err) {
      console.error('Failed to download license:', err);
      setError('Failed to download license PDF. Please try again.');
    } finally {
      setDownloadingLicense(false);
    }
  };

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
      setError('');
      const response = await authService.uploadLicenseImage(file);
      setEditData(prev => ({ ...prev, [fieldName]: response.url }));
    } catch (err) {
      console.error(`${fieldName} upload failed:`, err);
      setError(`Failed to upload ${fieldName.replace(/_/g, ' ')}. Please try again.`);
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (user.role === 'seller') {
      const required = ['shop_license_image', 'shop_logo', 'shop_front_image'];
      for (const field of required) {
        if (!editData[field]) {
          setError(`Please upload the ${field.replace(/_/g, ' ')}.`);
          setSaving(false);
          return;
        }
      }
    }

    try {
      await updateProfile(editData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.response?.data?.error || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    if (user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
        shop_name: user.shop_name || '',
        shop_location: user.shop_location || '',
        shop_license: user.shop_license || '',
        shop_type: user.shop_type || 'food',
        shop_license_image: user.shop_license_image || '',
        shop_owner_name: user.shop_owner_name || '',
        shop_address: user.shop_address || '',
        gps_location: user.gps_location || '',
        aadhaar_card: user.aadhaar_card || '',
        pan_card: user.pan_card || '',
        bank_account_details: user.bank_account_details || '',
        shop_logo: user.shop_logo || '',
        shop_front_image: user.shop_front_image || '',
        veg_nonveg: user.veg_nonveg || 'both',
        cuisine_type: user.cuisine_type || '',
        operating_hours: user.operating_hours || '',
        shop_interior_image: user.shop_interior_image || '',
        shop_kitchen_image: user.shop_kitchen_image || '',
        gstin: user.gstin || '',
        cancelled_cheque_image: user.cancelled_cheque_image || '',
        trademark_certificate: user.trademark_certificate || '',
        category_manager_approval: user.category_manager_approval || false,
        
        // Delivery fields
        profile_photo: user.profile_photo || '',
        aadhaar_front_image: user.aadhaar_front_image || '',
        aadhaar_back_image: user.aadhaar_back_image || '',
        pan_card_image: user.pan_card_image || '',
        live_selfie_image: user.live_selfie_image || '',
        driving_license_number: user.driving_license_number || '',
        driving_license_image: user.driving_license_image || '',
        vehicle_type: user.vehicle_type || 'bike',
        vehicle_number: user.vehicle_number || '',
        rc_book_image: user.rc_book_image || '',
        vehicle_insurance_image: user.vehicle_insurance_image || '',
        current_address: user.current_address || '',
        city: user.city || '',
        state: user.state || '',
        pin_code: user.pin_code || '',
        bank_account_holder_name: user.bank_account_holder_name || '',
        bank_name: user.bank_name || '',
        bank_account_number: user.bank_account_number || '',
        bank_ifsc_code: user.bank_ifsc_code || '',
        preferred_delivery_area: user.preferred_delivery_area || '',
        languages_known: user.languages_known || '',
        work_type: user.work_type || 'full-time',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
        emergency_contact_relationship: user.emergency_contact_relationship || ''
      });
    }
  };

  const isUploading = Object.values(uploadingFields).some(Boolean);

  return (
    <div className="dashboard-page" id="buyer-food-profile">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Profile</h1>
          <p>Manage your account details and business onboarding</p>
        </div>
        {!isEditing && (
          <button 
            className="btn-primary" 
            onClick={() => setIsEditing(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiEdit2 size={14} /> Edit Profile
          </button>
        )}
      </div>

      {success && <div className="auth-success" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{success}</div>}
      {error && <div className="auth-error" style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

      <div className="profile-card">
        <div className="profile-cover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '20px', background: 'linear-gradient(135deg, #1f2937, #111827)' }}>
          <div className="profile-avatar-lg" style={{ border: '4px solid var(--border)' }}>
            {user?.role === 'delivery' && editData.profile_photo ? (
              <img src={editData.profile_photo} alt="Profile Photo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : editData.shop_logo ? (
              <img src={editData.shop_logo} alt="Shop Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
        </div>
        
        <div className="profile-body">
          {(user?.role === 'seller' || user?.role === 'delivery') && (
            <div className="profile-sub-tabs" style={{ display: 'flex', gap: '15px', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveSubTab('basic')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeSubTab === 'basic' ? '2px solid #10b981' : '2px solid transparent',
                  color: activeSubTab === 'basic' ? '#10b981' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {user.role === 'delivery' ? '📋 Basic Info & Preferences' : '📋 Basic Info & Onboarding'}
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('verification')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeSubTab === 'verification' ? '2px solid #10b981' : '2px solid transparent',
                  color: activeSubTab === 'verification' ? '#10b981' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {user.role === 'delivery' ? '🛡️ Verification, Vehicle & Bank Docs' : '🛡️ Verification & Legal Docs'}
              </button>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
              {((user?.role !== 'seller' && user?.role !== 'delivery') || activeSubTab === 'basic') && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name / Owner Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={editData.phone}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  {user?.role === 'seller' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Shop Name</label>
                          <input
                            type="text"
                            name="shop_name"
                            value={editData.shop_name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Shop Owner Name</label>
                          <input
                            type="text"
                            name="shop_owner_name"
                            value={editData.shop_owner_name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Shop Type</label>
                          <select
                            name="shop_type"
                            value={editData.shop_type}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                          >
                            <option value="food">Food Shop (Restaurant)</option>
                            <option value="grocery">Grocery Shop</option>
                          </select>
                        </div>
                        {editData.shop_type === 'food' ? (
                          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Veg / Non-Veg Preference</label>
                            <select
                              name="veg_nonveg"
                              value={editData.veg_nonveg}
                              onChange={handleChange}
                              required
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                            >
                              <option value="both">Veg & Non-Veg</option>
                              <option value="veg">Pure Veg</option>
                              <option value="non-veg">Non-Veg Only</option>
                            </select>
                          </div>
                        ) : (
                          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>GSTIN</label>
                            <input
                              type="text"
                              name="gstin"
                              value={editData.gstin}
                              onChange={handleChange}
                              placeholder="22AAAAA0000A1Z5"
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                            />
                          </div>
                        )}
                      </div>

                      {editData.shop_type === 'food' && (
                        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Operating Hours</label>
                          <input
                            type="text"
                            name="operating_hours"
                            value={editData.operating_hours}
                            onChange={handleChange}
                            placeholder="9:00 AM - 11:00 PM"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {user?.role === 'delivery' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preferred Delivery Area</label>
                          <input
                            type="text"
                            name="preferred_delivery_area"
                            value={editData.preferred_delivery_area}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Languages Known</label>
                          <input
                            type="text"
                            name="languages_known"
                            value={editData.languages_known}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Work Preference</label>
                          <select
                            name="work_type"
                            value={editData.work_type}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                          >
                            <option value="full-time">Full-Time</option>
                            <option value="part-time">Part-Time</option>
                          </select>
                        </div>
                      </div>

                      <h3 style={{ margin: '10px 0 0 0', fontSize: '0.95rem', color: '#10b981' }}>🚨 Emergency Contacts (Two Numbers)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Emergency Contact Number 1</label>
                          <input
                            type="tel"
                            name="emergency_contact_phone"
                            value={editData.emergency_contact_phone}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Emergency Contact Number 2</label>
                          <input
                            type="tel"
                            name="emergency_contact_relationship"
                            value={editData.emergency_contact_relationship}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {user?.role === 'seller' && activeSubTab === 'verification' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Locality / Area Location</label>
                      <input
                        type="text"
                        name="shop_location"
                        value={editData.shop_location}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>GPS Pin Location Coordinates</label>
                      <input
                        type="text"
                        name="gps_location"
                        value={editData.gps_location}
                        onChange={handleChange}
                        readOnly
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#f3f4f6', color: '#1f2937' }}
                      />
                    </div>
                  </div>

                  <LocationPickerMap
                    value={editData.gps_location}
                    onChange={(coords) => setEditData(prev => ({ ...prev, gps_location: coords }))}
                    onAddressResolve={(addr) => setEditData(prev => ({
                      ...prev,
                      shop_address: addr.current_address,
                      shop_location: addr.city || addr.state
                    }))}
                  />

                  <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Street Address</label>
                    <textarea
                      name="shop_address"
                      value={editData.shop_address}
                      onChange={handleChange}
                      required
                      rows={2}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>FSSAI License Number</label>
                      <input
                        type="text"
                        name="shop_license"
                        value={editData.shop_license}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Aadhaar Card Number</label>
                      <input
                        type="text"
                        name="aadhaar_card"
                        value={editData.aadhaar_card}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>PAN Card Number</label>
                      <input
                        type="text"
                        name="pan_card"
                        value={editData.pan_card}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bank Account Details (Bank, A/C No, IFSC)</label>
                    <input
                      type="text"
                      name="bank_account_details"
                      value={editData.bank_account_details}
                      onChange={handleChange}
                      required
                      placeholder="e.g. HDFC Bank, A/C: 50100232432, IFSC: HDFC0000124"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Document Upload Fields */}
                  <div style={{ marginTop: '15px' }}>
                    <h3>📸 Business Documents & Photos Upload</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
                      
                      {/* Logo Upload */}
                      <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Shop Logo</label>
                        {editData.shop_logo && <img src={editData.shop_logo} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', marginBottom: '8px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'shop_logo')} style={{ display: 'none' }} id="upload-shop-logo" />
                        <label htmlFor="upload-shop-logo" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                          {uploadingFields.shop_logo ? 'Uploading...' : 'Choose Logo'}
                        </label>
                      </div>

                      {/* Front Image Upload */}
                      <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Front Photo</label>
                        {editData.shop_front_image && <img src={editData.shop_front_image} alt="Front" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'shop_front_image')} style={{ display: 'none' }} id="upload-shop-front" />
                        <label htmlFor="upload-shop-front" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                          {uploadingFields.shop_front_image ? 'Uploading...' : 'Choose Photo'}
                        </label>
                      </div>

                      {/* License Doc Upload */}
                      <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>FSSAI Doc</label>
                        {editData.shop_license_image && <img src={editData.shop_license_image} alt="License" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'shop_license_image')} style={{ display: 'none' }} id="upload-shop-license" />
                        <label htmlFor="upload-shop-license" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                          {uploadingFields.shop_license_image ? 'Uploading...' : 'Choose File'}
                        </label>
                      </div>

                      {/* CONDITIONAL EXTRA PHOTOS FOR FOOD */}
                      {editData.shop_type === 'food' && (
                        <>
                          <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Interior Photo</label>
                            {editData.shop_interior_image && <img src={editData.shop_interior_image} alt="Interior" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'shop_interior_image')} style={{ display: 'none' }} id="upload-shop-interior" />
                            <label htmlFor="upload-shop-interior" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                              {uploadingFields.shop_interior_image ? 'Uploading...' : 'Choose Photo'}
                            </label>
                          </div>

                          <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Kitchen Photo</label>
                            {editData.shop_kitchen_image && <img src={editData.shop_kitchen_image} alt="Kitchen" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'shop_kitchen_image')} style={{ display: 'none' }} id="upload-shop-kitchen" />
                            <label htmlFor="upload-shop-kitchen" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                              {uploadingFields.shop_kitchen_image ? 'Uploading...' : 'Choose Photo'}
                            </label>
                          </div>
                        </>
                      )}

                      {/* CONDITIONAL EXTRA DOCUMENTS FOR GROCERY */}
                      {editData.shop_type === 'grocery' && (
                        <>
                          <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Cancelled Cheque</label>
                            {editData.cancelled_cheque_image && <img src={editData.cancelled_cheque_image} alt="Cheque" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cancelled_cheque_image')} style={{ display: 'none' }} id="upload-cheque" />
                            <label htmlFor="upload-cheque" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                              {uploadingFields.cancelled_cheque_image ? 'Uploading...' : 'Choose File'}
                            </label>
                          </div>

                          <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Trademark Certificate</label>
                            {editData.trademark_certificate && <img src={editData.trademark_certificate} alt="Trademark" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'trademark_certificate')} style={{ display: 'none' }} id="upload-trademark" />
                            <label htmlFor="upload-trademark" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                              {uploadingFields.trademark_certificate ? 'Uploading...' : 'Choose File'}
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {user?.role === 'delivery' && activeSubTab === 'verification' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Aadhaar Card Number</label>
                      <input
                        type="text"
                        name="aadhaar_card"
                        value={editData.aadhaar_card}
                        onChange={handleChange}
                        required
                        maxLength={12}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>PAN Card Number</label>
                      <input
                        type="text"
                        name="pan_card"
                        value={editData.pan_card}
                        onChange={handleChange}
                        required
                        maxLength={10}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Driving Licence Number</label>
                      <input
                        type="text"
                        name="driving_license_number"
                        value={editData.driving_license_number}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', textTransform: 'uppercase' }}
                      />
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vehicle Registration Number (RC)</label>
                      <input
                        type="text"
                        name="vehicle_number"
                        value={editData.vehicle_number}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vehicle Type</label>
                      <select
                        name="vehicle_type"
                        value={editData.vehicle_type}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      >
                        <option value="bike">Bike</option>
                        <option value="scooter">Scooter</option>
                      </select>
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current Address</label>
                      <input
                        type="text"
                        name="current_address"
                        value={editData.current_address}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>City</label>
                      <input
                        type="text"
                        name="city"
                        value={editData.city}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>State</label>
                      <input
                        type="text"
                        name="state"
                        value={editData.state}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>PIN Code</label>
                      <input
                        type="text"
                        name="pin_code"
                        value={editData.pin_code}
                        onChange={handleChange}
                        required
                        maxLength={6}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start', marginTop: '15px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>GPS Pin Location Coordinates</label>
                    <input
                      type="text"
                      name="gps_location"
                      value={editData.gps_location}
                      onChange={handleChange}
                      readOnly
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#f3f4f6', color: '#1f2937' }}
                    />
                  </div>

                  <LocationPickerMap
                    value={editData.gps_location}
                    onChange={(coords) => setEditData(prev => ({ ...prev, gps_location: coords }))}
                    onAddressResolve={(addr) => setEditData(prev => ({
                      ...prev,
                      current_address: addr.current_address,
                      city: addr.city,
                      state: addr.state,
                      pin_code: addr.pin_code
                    }))}
                  />

                  <h3 style={{ margin: '10px 0 0 0', fontSize: '0.95rem', color: '#10b981' }}>💳 Bank Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Account Holder Name</label>
                      <input
                        type="text"
                        name="bank_account_holder_name"
                        value={editData.bank_account_holder_name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bank Name</label>
                      <input
                        type="text"
                        name="bank_name"
                        value={editData.bank_name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Account Number</label>
                      <input
                        type="text"
                        name="bank_account_number"
                        value={editData.bank_account_number}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>IFSC Code</label>
                      <input
                        type="text"
                        name="bank_ifsc_code"
                        value={editData.bank_ifsc_code}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>

                  {/* Document uploads for delivery partner */}
                  <div style={{ marginTop: '15px' }}>
                    <h3>📸 Verification Documents Upload</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
                      <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Profile Photo</label>
                        {editData.profile_photo && <img src={editData.profile_photo} alt="Profile" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', marginBottom: '8px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile_photo')} style={{ display: 'none' }} id="upload-profile-photo" />
                        <label htmlFor="upload-profile-photo" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                          {uploadingFields.profile_photo ? 'Uploading...' : 'Choose Photo'}
                        </label>
                      </div>

                      <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Aadhaar Front</label>
                        {editData.aadhaar_front_image && <img src={editData.aadhaar_front_image} alt="Aadhaar Front" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'aadhaar_front_image')} style={{ display: 'none' }} id="upload-aadhaar-front" />
                        <label htmlFor="upload-aadhaar-front" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                          {uploadingFields.aadhaar_front_image ? 'Uploading...' : 'Choose File'}
                        </label>
                      </div>

                      <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Aadhaar Back</label>
                        {editData.aadhaar_back_image && <img src={editData.aadhaar_back_image} alt="Aadhaar Back" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'aadhaar_back_image')} style={{ display: 'none' }} id="upload-aadhaar-back" />
                        <label htmlFor="upload-aadhaar-back" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                          {uploadingFields.aadhaar_back_image ? 'Uploading...' : 'Choose File'}
                        </label>
                      </div>

                      <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>PAN Card</label>
                        {editData.pan_card_image && <img src={editData.pan_card_image} alt="PAN Card" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'pan_card_image')} style={{ display: 'none' }} id="upload-pan-card" />
                        <label htmlFor="upload-pan-card" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                          {uploadingFields.pan_card_image ? 'Uploading...' : 'Choose File'}
                        </label>
                      </div>

                      <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Live Selfie</label>
                        {editData.live_selfie_image && <img src={editData.live_selfie_image} alt="Selfie" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', marginBottom: '8px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'live_selfie_image')} style={{ display: 'none' }} id="upload-live-selfie" />
                        <label htmlFor="upload-live-selfie" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                          {uploadingFields.live_selfie_image ? 'Uploading...' : 'Choose File'}
                        </label>
                      </div>

                      <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Driving Licence</label>
                        {editData.driving_license_image && <img src={editData.driving_license_image} alt="Licence" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'driving_license_image')} style={{ display: 'none' }} id="upload-dl" />
                        <label htmlFor="upload-dl" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                          {uploadingFields.driving_license_image ? 'Uploading...' : 'Choose File'}
                        </label>
                      </div>

                      <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>RC Book</label>
                        {editData.rc_book_image && <img src={editData.rc_book_image} alt="RC Book" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'rc_book_image')} style={{ display: 'none' }} id="upload-rc" />
                        <label htmlFor="upload-rc" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                          {uploadingFields.rc_book_image ? 'Uploading...' : 'Choose File'}
                        </label>
                      </div>

                      <div style={{ border: '1px dashed var(--border)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Vehicle Insurance</label>
                        {editData.vehicle_insurance_image && <img src={editData.vehicle_insurance_image} alt="Insurance" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'vehicle_insurance_image')} style={{ display: 'none' }} id="upload-insurance" />
                        <label htmlFor="upload-insurance" style={{ display: 'block', padding: '6px', background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                          {uploadingFields.vehicle_insurance_image ? 'Uploading...' : 'Choose File'}
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  <FiX size={14} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || isUploading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontWeight: 600, cursor: (saving || isUploading) ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? 'Saving...' : <><FiCheck size={14} /> Save Changes</>}
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2>{user?.role === 'delivery' ? user?.name : (user?.shop_name || user?.name || 'User')}</h2>
              <p className="profile-role" style={{ textTransform: 'capitalize' }}>
                {user?.role === 'delivery' ? 'Delivery Partner' : `${user?.role || 'buyer'} Shop`}
              </p>

              <div className="profile-details">
                {((user?.role !== 'seller' && user?.role !== 'delivery') || activeSubTab === 'basic') && (
                  <>
                    <div className="profile-detail-item">
                      <label><FiMail size={12} /> Email</label>
                      <span>{user?.email || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiPhone size={12} /> Phone</label>
                      <span>{user?.phone || 'Not set'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiCalendar size={12} /> Joined</label>
                      <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </>
                )}

                {user?.role === 'seller' && activeSubTab === 'basic' && (
                  <>
                    <div className="profile-detail-item">
                      <label><FiUser size={12} /> Shop Owner</label>
                      <span>{user?.shop_owner_name || user?.name || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><MdStorefront size={12} /> Shop Name</label>
                      <span>{user?.shop_name || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><MdCategory size={12} /> Shop Type</label>
                      <span style={{ textTransform: 'capitalize' }}>{user?.shop_type || 'N/A'}</span>
                    </div>
                    {user?.shop_type === 'food' ? (
                      <>
                        <div className="profile-detail-item">
                          <label><MdCategory size={12} /> Veg / Non-Veg</label>
                          <span style={{ textTransform: 'capitalize' }}>{user?.veg_nonveg || 'Both'}</span>
                        </div>
                        <div className="profile-detail-item">
                          <label><MdCategory size={12} /> Cuisine</label>
                          <span>{user?.cuisine_type || 'North Indian, Chinese'}</span>
                        </div>
                        <div className="profile-detail-item">
                          <label><FiClock size={12} /> Operating Hours</label>
                          <span>{user?.operating_hours || '9:00 AM - 11:00 PM'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="profile-detail-item">
                          <label><FiFileText size={12} /> GSTIN</label>
                          <span>{user?.gstin || 'N/A'}</span>
                        </div>
                        <div className="profile-detail-item">
                          <label><FiCheck size={12} /> Brand Approval</label>
                          <span>
                            <span className={`status-badge ${user?.category_manager_approval ? 'active' : 'pending'}`}>
                              {user?.category_manager_approval ? 'Approved by Category Manager' : 'Pending Approval'}
                            </span>
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}

                {user?.role === 'delivery' && activeSubTab === 'basic' && (
                  <>
                    <div className="profile-detail-item">
                      <label><FiMapPin size={12} /> Preferred Area</label>
                      <span>{user?.preferred_delivery_area || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiFileText size={12} /> Languages Known</label>
                      <span>{user?.languages_known || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiClock size={12} /> Work Preference</label>
                      <span style={{ textTransform: 'capitalize' }}>{user?.work_type || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiCheck size={12} /> Onboarding Status</label>
                      <span>
                        <span className={`status-badge ${user?.category_manager_approval ? 'active' : 'pending'}`}>
                          {user?.category_manager_approval ? 'Approved by Verification Team' : 'Pending Verification'}
                        </span>
                      </span>
                    </div>
                    <div className="profile-detail-item" style={{ gridColumn: 'span 2' }}>
                      <h3 style={{ margin: '15px 0 5px 0', fontSize: '0.9rem', color: '#10b981' }}>🚨 Emergency Contacts</h3>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiPhone size={12} /> Contact Number 1</label>
                      <span>{user?.emergency_contact_phone || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiPhone size={12} /> Contact Number 2</label>
                      <span>{user?.emergency_contact_relationship || 'N/A'}</span>
                    </div>
                  </>
                )}

                {user?.role === 'seller' && activeSubTab === 'verification' && (
                  <>
                    <div className="profile-detail-item">
                      <label><FiMapPin size={12} /> Location / Locality</label>
                      <span>{user?.shop_location || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiMapPin size={12} /> GPS Coordinates</label>
                      <span>{user?.gps_location || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item" style={{ gridColumn: 'span 2' }}>
                      <label><FiMapPin size={12} /> Full Address</label>
                      <span>{user?.shop_address || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiFileText size={12} /> FSSAI License Number</label>
                      <span>{user?.shop_license || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiFileText size={12} /> Aadhaar Card Number</label>
                      <span>{user?.aadhaar_card || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiFileText size={12} /> PAN Card Number</label>
                      <span>{user?.pan_card || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item" style={{ gridColumn: 'span 2' }}>
                      <label><FiFileText size={12} /> Bank Account Details</label>
                      <span>{user?.bank_account_details || 'N/A'}</span>
                    </div>

                    {/* Previews Grid */}
                    <div style={{ gridColumn: 'span 2', display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px' }}>
                      {user?.shop_license_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> License Doc</label>
                          <a href={user.shop_license_image} target="_blank" rel="noopener noreferrer">
                            <img src={user.shop_license_image} alt="License" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                          </a>
                        </div>
                      )}
                      {user?.shop_logo && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> Shop Logo</label>
                          <a href={user.shop_logo} target="_blank" rel="noopener noreferrer">
                            <img src={user.shop_logo} alt="Logo" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                          </a>
                        </div>
                      )}
                      {user?.shop_front_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> Front Image</label>
                          <a href={user.shop_front_image} target="_blank" rel="noopener noreferrer">
                            <img src={user.shop_front_image} alt="Front View" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                          </a>
                        </div>
                      )}
                      {user?.shop_interior_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> Interior Image</label>
                          <a href={user.shop_interior_image} target="_blank" rel="noopener noreferrer">
                            <img src={user.shop_interior_image} alt="Interior View" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                          </a>
                        </div>
                      )}
                      {user?.shop_kitchen_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> Kitchen Image</label>
                          <a href={user.shop_kitchen_image} target="_blank" rel="noopener noreferrer">
                            <img src={user.shop_kitchen_image} alt="Kitchen View" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                          </a>
                        </div>
                      )}
                      {user?.cancelled_cheque_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> Cancelled Cheque</label>
                          <a href={user.cancelled_cheque_image} target="_blank" rel="noopener noreferrer">
                            <img src={user.cancelled_cheque_image} alt="Cancelled Cheque" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                          </a>
                        </div>
                      )}
                      {user?.trademark_certificate && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> Trademark Cert</label>
                          <a href={user.trademark_certificate} target="_blank" rel="noopener noreferrer">
                            <img src={user.trademark_certificate} alt="Trademark Certificate" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {user?.role === 'delivery' && activeSubTab === 'verification' && (
                  <>
                    <div className="profile-detail-item">
                      <label><FiFileText size={12} /> Aadhaar Card Number</label>
                      <span>{user?.aadhaar_card || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiFileText size={12} /> PAN Card Number</label>
                      <span>{user?.pan_card || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiFileText size={12} /> Driving Licence Number</label>
                      <span>{user?.driving_license_number || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><FiFileText size={12} /> Vehicle Registration Number (RC)</label>
                      <span>{user?.vehicle_number || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <label><MdDirectionsBike size={12} /> Vehicle Type</label>
                      <span style={{ textTransform: 'capitalize' }}>{user?.vehicle_type || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item" style={{ gridColumn: 'span 2' }}>
                      <label><FiMapPin size={12} /> Current Address</label>
                      <span>{user?.current_address ? `${user.current_address}, ${user.city || ''}, ${user.state || ''} - ${user.pin_code || ''}` : 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item" style={{ gridColumn: 'span 2' }}>
                      <label><FiMapPin size={12} /> GPS Coordinates</label>
                      <span>{user?.gps_location || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item" style={{ gridColumn: 'span 2' }}>
                      <label><FiFileText size={12} /> Bank Details (Holder, Bank, A/C, IFSC)</label>
                      <span>
                        {user?.bank_account_holder_name ? `${user.bank_account_holder_name} | ${user.bank_name || ''} | A/C: ${user.bank_account_number || ''} | IFSC: ${user.bank_ifsc_code || ''}` : 'N/A'}
                      </span>
                    </div>

                    {/* Previews Grid for Delivery */}
                    <div style={{ gridColumn: 'span 2', display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px' }}>
                      {user?.profile_photo && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                           <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> Profile Photo</label>
                           <a href={user.profile_photo} target="_blank" rel="noopener noreferrer">
                             <img src={user.profile_photo} alt="Profile" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                           </a>
                        </div>
                      )}
                      {user?.aadhaar_front_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                           <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> Aadhaar Front</label>
                           <a href={user.aadhaar_front_image} target="_blank" rel="noopener noreferrer">
                             <img src={user.aadhaar_front_image} alt="Aadhaar Front" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                           </a>
                        </div>
                      )}
                      {user?.aadhaar_back_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                           <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> Aadhaar Back</label>
                           <a href={user.aadhaar_back_image} target="_blank" rel="noopener noreferrer">
                             <img src={user.aadhaar_back_image} alt="Aadhaar Back" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                           </a>
                        </div>
                      )}
                      {user?.pan_card_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                           <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> PAN Card</label>
                           <a href={user.pan_card_image} target="_blank" rel="noopener noreferrer">
                             <img src={user.pan_card_image} alt="PAN Card" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                           </a>
                        </div>
                      )}
                      {user?.live_selfie_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                           <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> Live Selfie</label>
                           <a href={user.live_selfie_image} target="_blank" rel="noopener noreferrer">
                             <img src={user.live_selfie_image} alt="Selfie" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                           </a>
                        </div>
                      )}
                      {user?.driving_license_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                           <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> DL Licence</label>
                           <a href={user.driving_license_image} target="_blank" rel="noopener noreferrer">
                             <img src={user.driving_license_image} alt="Licence" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                           </a>
                        </div>
                      )}
                      {user?.rc_book_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                           <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> RC Book</label>
                           <a href={user.rc_book_image} target="_blank" rel="noopener noreferrer">
                             <img src={user.rc_book_image} alt="RC Book" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                           </a>
                        </div>
                      )}
                      {user?.vehicle_insurance_image && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                           <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FiUpload size={12} /> Vehicle Ins.</label>
                           <a href={user.vehicle_insurance_image} target="_blank" rel="noopener noreferrer">
                             <img src={user.vehicle_insurance_image} alt="Insurance" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }} />
                           </a>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
