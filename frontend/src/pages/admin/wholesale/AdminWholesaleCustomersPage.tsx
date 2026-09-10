import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../../api/client';
import { useToast } from '../../../components/common/Toast';
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  FileSpreadsheet,
  AlertTriangle,
  X,
  Camera,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  User,
  ShieldCheck,
} from 'lucide-react';

import { CustomerPhotoPreview } from '../../../components/common/CustomerPhotoPreview';
import { formatCurrency } from '../../../utils/formatters';

interface WholesaleCustomer {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstRegistered?: boolean;
  gstin?: string;
  pan?: string;
  creditLimit: number;
  outstandingBalance: number;
  paymentTerms: string;
  dueDays: number;
  photoUrl?: string;
  photoStorageKey?: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'BLOCKED' | 'INACTIVE';
  _count?: {
    invoices: number;
    payments: number;
  };
}

export const AdminWholesaleCustomersPage: React.FC = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<WholesaleCustomer | null>(null);
  const [saving, setSaving] = useState(false);

  // Lightbox State
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{
    isOpen: boolean;
    photoUrl?: string;
    businessName?: string;
    contactPerson?: string;
    mobile?: string;
  }>({ isOpen: false });

  // Form Fields
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    mobile: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstRegistered: false,
    gstin: '',
    pan: '',
    creditLimit: '500000',
    paymentTerms: 'NET 30 Days',
    dueDays: '30',
    status: 'ACTIVE' as 'ACTIVE' | 'ON_HOLD' | 'BLOCKED' | 'INACTIVE',
    notes: '',
  });

  // Photo & Camera State
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const [photoBlob, setPhotoBlob] = useState<Blob | File | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchApi<{ success: boolean; data: WholesaleCustomer[] }>('/wholesale/customers');
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load wholesale customer accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Cleanup camera stream on unmount or modal close
  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Start Camera Feed
  const startCamera = async () => {
    setCameraError('');
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera capture is not supported on this browser/device.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer rear camera on mobile, webcam on desktop
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      // Attach stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.error('Video play error:', err));
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera permission/access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access is blocked. Please allow camera permissions or upload a photo instead.');
      } else {
        setCameraError('Unable to access camera device. You can upload a photo instead.');
      }
      stopCameraStream();
    }
  };

  // Capture Photo Frame from Video
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    let width = video.videoWidth || 640;
    let height = video.videoHeight || 480;

    // Scale down if exceeds max 1600px width
    const maxWidth = 1600;
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const capturedFile = new File([blob], `customer_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPhotoBlob(capturedFile);
            setPhotoPreviewUrl(URL.createObjectURL(blob));
            stopCameraStream();
            showToast('Customer photo captured successfully.', 'success');
          }
        },
        'image/jpeg',
        0.85 // High quality JPEG
      );
    }
  };

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Invalid photo format. Please upload JPG, PNG, or WEBP.', 'error');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit. Please select a smaller file.', 'error');
      return;
    }

    stopCameraStream();
    setPhotoBlob(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    showToast('Photo selected.', 'info');
  };

  // Remove Selected Photo
  const removePhoto = () => {
    stopCameraStream();
    setPhotoBlob(null);
    setPhotoPreviewUrl('');
  };

  // Open Create Modal
  const openCreateModal = () => {
    stopCameraStream();
    setEditingCustomer(null);
    setFormData({
      businessName: '',
      contactPerson: '',
      mobile: '',
      whatsapp: '',
      email: '',
      address: '',
      city: '',
      state: '',
      gstRegistered: false,
      gstin: '',
      pan: '',
      creditLimit: '500000',
      paymentTerms: 'NET 30 Days',
      dueDays: '30',
      status: 'ACTIVE',
      notes: '',
    });
    setPhotoBlob(null);
    setPhotoPreviewUrl('');
    setCameraError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (c: WholesaleCustomer) => {
    stopCameraStream();
    setEditingCustomer(c);
    setFormData({
      businessName: c.businessName,
      contactPerson: c.contactPerson || '',
      mobile: c.mobile,
      whatsapp: c.whatsapp || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      gstRegistered: c.gstRegistered ?? (!!c.gstin && c.gstin.trim() !== ''),
      gstin: c.gstin || '',
      pan: c.pan || '',
      creditLimit: c.creditLimit.toString(),
      paymentTerms: c.paymentTerms,
      dueDays: c.dueDays.toString(),
      status: c.status,
      notes: '',
    });
    setPhotoBlob(null);
    setPhotoPreviewUrl(c.photoUrl || '');
    setCameraError('');
    setIsModalOpen(true);
  };

  // Close Modal Safely
  const closeModal = () => {
    stopCameraStream();
    setIsModalOpen(false);
  };

  // Save Customer (Form Submit)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Field Validations
    if (!formData.businessName.trim()) {
      showToast('Business Name is required.', 'error');
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    if (formData.gstRegistered && formData.gstin && formData.gstin.trim().length > 0) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(formData.gstin.trim().toUpperCase())) {
        showToast('Please enter a valid 15-character GSTIN (e.g. 33AAAAA0000A1Z5).', 'error');
        return;
      }
    }

    const parsedCreditLimit = parseFloat(formData.creditLimit);
    if (isNaN(parsedCreditLimit) || parsedCreditLimit < 0) {
      showToast('Credit Limit must be a non-negative number.', 'error');
      return;
    }

    try {
      setSaving(true);

      // Step 1: Upload Photo if a new file/blob was captured/selected
      let uploadedPhotoUrl = editingCustomer?.photoUrl || undefined;
      let uploadedPhotoStorageKey = editingCustomer?.photoStorageKey || undefined;

      if (photoBlob) {
        setUploadingPhoto(true);
        const data = new FormData();
        data.append('image', photoBlob, `customer_${Date.now()}.jpg`);

        const uploadRes = await fetchApi<{ success: boolean; url: string; storageKey: string }>('/upload/image', {
          method: 'POST',
          body: data,
        });

        if (uploadRes.success && uploadRes.url) {
          uploadedPhotoUrl = uploadRes.url;
          uploadedPhotoStorageKey = uploadRes.storageKey;
        }
        setUploadingPhoto(false);
      } else if (photoPreviewUrl === '') {
        // Explicitly removed photo
        uploadedPhotoUrl = undefined;
        uploadedPhotoStorageKey = undefined;
      }

      // Step 2: Create or Update Wholesale Customer
      const payload = {
        ...formData,
        mobile: cleanMobile,
        gstRegistered: formData.gstRegistered,
        gstin: formData.gstRegistered && formData.gstin ? formData.gstin.trim().toUpperCase() : null,
        creditLimit: parsedCreditLimit,
        dueDays: parseInt(formData.dueDays) || 30,
        photoUrl: uploadedPhotoUrl,
        photoStorageKey: uploadedPhotoStorageKey,
      };

      if (editingCustomer) {
        await fetchApi(`/wholesale/customers/${editingCustomer.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('Wholesale customer profile updated successfully.', 'success');
      } else {
        await fetchApi('/wholesale/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Wholesale customer registered successfully.', 'success');
      }

      closeModal();
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'Unable to save customer profile. Please try again.', 'error');
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.businessName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.mobile.includes(debouncedSearch) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
      (c.gstin && c.gstin.toLowerCase().includes(debouncedSearch.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-6 bg-luxury-ivory min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-border pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-charcoal font-bold flex items-center gap-3">
            <Building2 className="w-7 h-7 text-luxury-gold" />
            WHOLESALE CUSTOMERS
          </h1>
          <p className="text-xs text-luxury-gray mt-1">
            Manage wholesale retailers, credit limits, outstanding balances and business details.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> ADD WHOLESALE CUSTOMER
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-luxury-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-luxury-gray" />
          <input
            type="text"
            placeholder="Search business, contact, phone, GSTIN..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white border border-luxury-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {(['ALL', 'ACTIVE', 'ON_HOLD', 'BLOCKED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-bold uppercase transition-all ${
                statusFilter === st
                  ? 'bg-luxury-gold text-white shadow-sm'
                  : 'bg-luxury-ivory text-luxury-gray hover:text-luxury-charcoal'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List Table */}
      {loading ? (
        <div className="text-center py-16 text-xs text-luxury-gray">
          Loading wholesale retailer directory...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-luxury-border shadow-card text-xs text-luxury-gray">
          No wholesale customers found matching query.
        </div>
      ) : (
        <div className="bg-white border border-luxury-border rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-luxury-border bg-luxury-ivory/50 text-luxury-gray font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4 text-center">Photo</th>
                  <th className="py-3.5 px-4">Business & Contact</th>
                  <th className="py-3.5 px-4">Phone / GSTIN</th>
                  <th className="py-3.5 px-4 text-right">Credit Limit</th>
                  <th className="py-3.5 px-4 text-right">Outstanding Dues</th>
                  <th className="py-3.5 px-4 text-right">Available Credit</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/60">
                {filteredCustomers.map((c) => {
                  const availableCredit = Math.max(0, c.creditLimit - c.outstandingBalance);
                  const initials = c.businessName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={c.id} className="hover:bg-luxury-ivory/30 transition-colors">
                      {/* Photo Thumbnail */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewPhotoModal({
                              isOpen: true,
                              photoUrl: c.photoUrl,
                              businessName: c.businessName,
                              contactPerson: c.contactPerson,
                              mobile: c.mobile,
                            })
                          }
                          className="w-10 h-10 rounded-full bg-luxury-ivory border border-luxury-border overflow-hidden mx-auto flex items-center justify-center shrink-0 hover:ring-2 hover:ring-luxury-gold hover:opacity-90 transition-all cursor-pointer group relative"
                          title="Click to preview photo lightbox"
                        >
                          {c.photoUrl ? (
                            <img src={c.photoUrl} alt={c.businessName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-serif font-bold text-xs text-luxury-gold">{initials}</span>
                          )}
                        </button>
                      </td>

                      {/* Business & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-luxury-charcoal text-sm">{c.businessName}</div>
                        {c.contactPerson && (
                          <div className="text-[11px] text-luxury-gray">Contact: {c.contactPerson}</div>
                        )}
                      </td>

                      {/* Phone & GSTIN */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-luxury-charcoal font-semibold">{c.mobile}</div>
                        {c.gstRegistered || c.gstin ? (
                          <div className="text-[10px] text-emerald-700 font-mono font-bold">
                            GST: {c.gstin || 'Registered'}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-medium">GST: Not Registered</div>
                        )}
                      </td>

                      {/* Credit Limit */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-luxury-charcoal">
                        {formatCurrency(c.creditLimit)}
                      </td>

                      {/* Outstanding Dues */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                        {formatCurrency(c.outstandingBalance)}
                      </td>

                      {/* Available Credit */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={availableCredit > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {formatCurrency(availableCredit)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : c.status === 'ON_HOLD'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/wholesale/ledger/${c.id}`}
                            className="px-2.5 py-1.5 bg-white border border-luxury-border text-luxury-charcoal hover:bg-luxury-ivory rounded-lg font-bold text-[11px] shadow-sm inline-flex items-center gap-1"
                            title="View Statement Ledger"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-luxury-gold" /> Ledger
                          </Link>
                          <button
                            onClick={() => openEditModal(c)}
                            className="px-2.5 py-1.5 bg-white border border-luxury-border text-luxury-charcoal hover:bg-luxury-ivory rounded-lg font-bold text-[11px] shadow-sm inline-flex items-center gap-1"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Wholesale Customer Modal Target */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-luxury-charcoal/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-luxury-border rounded-2xl max-w-4xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-slide-up">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-luxury-border p-5 flex items-center justify-between z-10 shrink-0">
              <h3 className="font-serif text-lg font-bold text-luxury-charcoal flex items-center gap-2">
                <Building2 className="w-5 h-5 text-luxury-gold" />
                {editingCustomer ? 'Edit Wholesale Customer Profile' : 'Register New Wholesale Customer'}
              </h3>
              <button onClick={closeModal} className="text-luxury-gray hover:text-luxury-charcoal p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-admin-scrollbar space-y-6">
              <form id="wholesale-customer-form" onSubmit={handleSaveCustomer} className="space-y-6 text-xs">
                {/* 2-Column Grid: 30-35% Left (Photo Section) | 65-70% Right (Business Info) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Customer Photo Section (4 cols / ~33%) */}
                  <div className="lg:col-span-4 space-y-3 bg-luxury-ivory/40 p-4 rounded-xl border border-luxury-border flex flex-col items-center">
                    <span className="text-xs font-bold text-luxury-charcoal uppercase tracking-wider self-start flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-luxury-gold" /> CUSTOMER PHOTO
                    </span>

                    {/* Camera Preview / Captured Photo Box */}
                    <div className="relative w-44 h-44 rounded-2xl bg-white border-2 border-luxury-border overflow-hidden flex items-center justify-center shadow-inner group">
                      {isCameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : photoPreviewUrl ? (
                        <img src={photoPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center space-y-2 p-3">
                          <Camera className="w-8 h-8 text-luxury-gold/50 mx-auto" />
                          <p className="text-[10px] text-luxury-gray font-semibold leading-tight">
                            Add customer photo via webcam or file upload
                          </p>
                        </div>
                      )}

                      {/* Active Live Indicator */}
                      {isCameraActive && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold animate-pulse flex items-center gap-1">
                          ● LIVE CAMERA
                        </div>
                      )}
                    </div>

                    {/* Hidden canvas for capturing frame */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Camera Permission / Access Warning */}
                    {cameraError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] rounded-lg w-full flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span>{cameraError}</span>
                      </div>
                    )}

                    {/* Camera & Upload Action Buttons */}
                    <div className="w-full space-y-2 pt-1">
                      {isCameraActive ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
                          >
                            ● CAPTURE PHOTO
                          </button>
                          <button
                            type="button"
                            onClick={stopCameraStream}
                            className="px-3 py-2 bg-white border border-luxury-border text-luxury-charcoal rounded-xl font-bold text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : photoPreviewUrl ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="py-2 bg-white border border-luxury-border hover:bg-luxury-ivory text-luxury-charcoal font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 shadow-sm"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-luxury-gold" /> Retake
                          </button>

                          <button
                            type="button"
                            onClick={removePhoto}
                            className="py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 w-full">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="w-full py-2.5 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Camera className="w-4 h-4" /> TAKE PHOTO
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2 bg-white hover:bg-luxury-ivory text-luxury-charcoal border border-luxury-border font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Upload className="w-4 h-4 text-luxury-gold" /> UPLOAD PHOTO
                          </button>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Business & Credit Details (8 cols / ~67%) */}
                  <div className="lg:col-span-8 space-y-4">
                    <span className="text-xs font-bold text-luxury-charcoal uppercase tracking-wider block border-b border-luxury-border pb-1">
                      BUSINESS INFORMATION
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-luxury-charcoal font-bold mb-1">Business Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. ABC Jewellers Pvt Ltd"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-luxury-charcoal font-bold mb-1">Mobile / Phone Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 9842412345"
                          value={formData.mobile}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                          className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 font-mono text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-luxury-gray font-semibold mb-1">Contact Person Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Kumar (Owner)"
                          value={formData.contactPerson}
                          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                          className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                        />
                      </div>

                      <div className="sm:col-span-2 bg-luxury-ivory/50 p-3.5 rounded-xl border border-luxury-border">
                        <label className="block text-luxury-charcoal font-bold mb-2">GST Registration Status</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="gstRegistered"
                              checked={!formData.gstRegistered}
                              onChange={() => setFormData({ ...formData, gstRegistered: false, gstin: '' })}
                              className="w-4 h-4 text-luxury-gold focus:ring-luxury-gold"
                            />
                            <span className="font-semibold text-luxury-charcoal">Not Registered (Default - GST OFF)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="gstRegistered"
                              checked={formData.gstRegistered}
                              onChange={() => setFormData({ ...formData, gstRegistered: true })}
                              className="w-4 h-4 text-luxury-gold focus:ring-luxury-gold"
                            />
                            <span className="font-semibold text-luxury-charcoal">Registered (Has GSTIN)</span>
                          </label>
                        </div>
                      </div>

                      {formData.gstRegistered ? (
                        <div>
                          <label className="block text-luxury-charcoal font-bold mb-1">GSTIN Number *</label>
                          <input
                            type="text"
                            required={formData.gstRegistered}
                            placeholder="33AAAAA0000A1Z5"
                            value={formData.gstin}
                            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                            className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 font-mono text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm uppercase font-bold"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 text-xs font-medium">
                          GST Not Registered • Customer saves without GSTIN requirement
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label className="block text-luxury-gray font-semibold mb-1">Store / Business Address</label>
                        <input
                          type="text"
                          placeholder="e.g. 45 Bazaar Street, Madurai"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
                        />
                      </div>
                    </div>

                    <span className="text-xs font-bold text-luxury-charcoal uppercase tracking-wider block border-b border-luxury-border pb-1 pt-2">
                      CREDIT & ACCOUNT TERMS
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-luxury-charcoal font-bold mb-1">Approved Credit Limit (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.creditLimit}
                          onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                          className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 font-mono text-luxury-charcoal font-bold focus:outline-none focus:border-luxury-gold shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-luxury-charcoal font-bold mb-1">Payment Terms *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. NET 30 Days"
                          value={formData.paymentTerms}
                          onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                          className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm font-medium"
                        />
                      </div>

                      {editingCustomer && (
                        <div>
                          <label className="block text-luxury-charcoal font-bold mb-1">Account Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 text-luxury-charcoal font-medium focus:outline-none focus:border-luxury-gold shadow-sm"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="ON_HOLD">ON_HOLD</option>
                            <option value="BLOCKED">BLOCKED</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t border-luxury-border p-4 flex justify-end gap-3 z-10 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 bg-white text-luxury-charcoal border border-luxury-border rounded-xl font-bold text-xs hover:bg-luxury-ivory transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="wholesale-customer-form"
                disabled={saving || uploadingPhoto}
                className="px-6 py-2.5 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving || uploadingPhoto ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving Customer...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Save Customer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Photo Preview Lightbox Modal */}
      <CustomerPhotoPreview
        isOpen={previewPhotoModal.isOpen}
        onClose={() => setPreviewPhotoModal({ ...previewPhotoModal, isOpen: false })}
        photoUrl={previewPhotoModal.photoUrl}
        businessName={previewPhotoModal.businessName}
        contactPerson={previewPhotoModal.contactPerson}
        mobile={previewPhotoModal.mobile}
      />
    </div>
  );
};

export default AdminWholesaleCustomersPage;
