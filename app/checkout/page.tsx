'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';

// ============================================================================
// CAPA DE DOMINIO Y TIPOS
// ============================================================================

type CreditCard = {
  card_number: string;
  cardholder_name: string;
  cvv: string;
  expiration_date: string;
};

type BillingAddress = {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type CheckoutData = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  credit_card: CreditCard;
  billing_address: BillingAddress;
  shipping_address?: BillingAddress;
  pickuptime: string;
  items: Array<{
    product_variant_id: string;
    quantity: number;
  }>;
};

type CartItem = {
  id: string;
  productvariant: {
    id: string;
    name: string;
    description: string;
    selling_price: number;
  };
  quantity: number;
};

type User = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  matricula: string;
  phone_number: string;
  permissions: string[];
  profilepicture: string;
};

type PickupTimeSlot = {
  date: string;
  time: string;
  available: boolean;
};

type CheckoutPageData = {
  status: string;
  data: {
    cart: { items: CartItem[] };
    user: User;
    pickup_times: PickupTimeSlot[];
  };
};

// ============================================================================
// CAPA DE SERVICIO (I/O y Lógica de Red)
// ============================================================================

class CheckoutService {
  constructor(public baseurl: string) {}

  async getCheckoutData(): Promise<CheckoutPageData> {
    const [checkoutResponse, timeslotsResponse] = await Promise.all([
      fetch(`${this.baseurl}/api/v1/checkout/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }),
      fetch(`${this.baseurl}/api/v1/checkout/timeslots`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }),
    ]);

    if (!checkoutResponse.ok) {
      throw new Error(`Failed to fetch checkout data: ${checkoutResponse.status}`);
    }

    const checkoutData = await checkoutResponse.json();
    const pickupTimes: PickupTimeSlot[] = [];

    if (timeslotsResponse.ok) {
      const timeslotsData = await timeslotsResponse.json();
      if (Array.isArray(timeslotsData?.availableDates)) {
        timeslotsData.availableDates.forEach((dateSlot: { date: string; slots: string[] }) => {
          dateSlot.slots.forEach((time: string) => {
            pickupTimes.push({ date: dateSlot.date, time, available: true });
          });
        });
      }
    }

    return {
      status: checkoutData.status || 'success',
      data: {
        cart: checkoutData.data?.cart || { items: [] },
        user: checkoutData.data?.user || {
          id: '', firstname: '', lastname: '', email: '', matricula: '',
          phone_number: '', permissions: [], profilepicture: '',
        },
        pickup_times: pickupTimes,
      },
    };
  }

  async executeCheckout(formData: CheckoutData): Promise<void> {
    const [expiry_month, expiry_year] = formData.credit_card.expiration_date.split('/');
    
    const transformedData = {
      billing_contact: {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        phone_number: formData.phone,
      },
      billing_address: {
        street: formData.billing_address.street,
        apartment: formData.billing_address.apartment || '',
        city: formData.billing_address.city,
        country: formData.billing_address.country || 'Dominican Republic',
        postal_code: formData.billing_address.postal_code,
        state: formData.billing_address.state,
      },
      card_information: {
        card_number: formData.credit_card.card_number.replace(/\s/g, ''),
        expiry_month: parseInt(expiry_month, 10),
        expiry_year: parseInt(expiry_year, 10),
        cvv: parseInt(formData.credit_card.cvv, 10),
      },
      pickuptime: formData.pickuptime,
      items: formData.items.map(item => ({
        productvariantid: parseInt(item.product_variant_id, 10),
        quantity: item.quantity,
      })),
    };

    const response = await fetch(`${this.baseurl}/api/v1/checkout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(transformedData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Checkout failed: ${response.status} - ${errorText}`);
    }
  }
}

// ============================================================================
// CUSTOM HOOK: LÓGICA DE ESTADO Y NEGOCIO
// ============================================================================

type CheckoutStep = 'contact' | 'shipping' | 'payment' | 'review';
type FormErrors = Record<string, string>;

function useCheckoutLogic() {
  const [step, setStep] = useState<CheckoutStep>('contact');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutPageData | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);

  const [formData, setFormData] = useState<CheckoutData>({
    firstname: '', lastname: '', email: '', phone: '',
    credit_card: { card_number: '', cardholder_name: '', cvv: '', expiration_date: '' },
    billing_address: { street: '', city: '', state: '', postal_code: '', country: '' },
    shipping_address: { street: '', city: '', state: '', postal_code: '', country: '' },
    pickuptime: '', items: [],
  });

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const service = new CheckoutService(process.env.NEXT_PUBLIC_API_URL || '');
        const data = await service.getCheckoutData();
        if (!isMounted) return;

        setCheckoutData(data);
        setFormData(prev => ({
          ...prev,
          firstname: data.data.user.firstname || '',
          lastname: data.data.user.lastname || '',
          email: data.data.user.email || '',
          phone: data.data.user.phone_number || '',
          items: data.data.cart.items.map(item => ({
            product_variant_id: item.productvariant.id,
            quantity: item.quantity,
          })),
        }));
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load checkout data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  const totalAmount = useMemo(() => {
    return checkoutData?.data.cart.items.reduce(
      (sum, item) => sum + item.productvariant.selling_price * item.quantity, 0
    ) || 0;
  }, [checkoutData?.data.cart.items]);

  const validateStep = useCallback(() => {
    const errors: FormErrors = {};
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePhone = (phone: string) => /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(phone.replace(/\s/g, ''));
    const validateCard = (card: string) => {
      const cleaned = card.replace(/\s/g, '');
      return cleaned.length >= 13 && cleaned.length <= 19 && /^\d+$/.test(cleaned);
    };

    if (step === 'contact') {
      if (!formData.firstname.trim()) errors.firstname = 'El nombre es requerido';
      if (!formData.lastname.trim()) errors.lastname = 'El apellido es requerido';
      if (!formData.email.trim()) errors.email = 'El correo es requerido';
      else if (!validateEmail(formData.email)) errors.email = 'El correo no es válido';
      if (!formData.phone.trim()) errors.phone = 'Se requiere un número de teléfono';
      else if (!validatePhone(formData.phone)) errors.phone = 'Formato de teléfono inválido';
    }

    if (step === 'shipping') {
      const checkAddress = (address: BillingAddress, prefix: string) => {
        if (!address.street.trim()) errors[`${prefix}_street`] = 'La calle es requerida';
        if (!address.city.trim()) errors[`${prefix}_city`] = 'La ciudad es requerida';
        if (!address.state.trim()) errors[`${prefix}_state`] = 'El estado es requerido';
        if (!address.postal_code.trim()) errors[`${prefix}_postal_code`] = 'El código postal es requerido';
        if (!address.country.trim()) errors[`${prefix}_country`] = 'El país es requerido';
      };
      checkAddress(formData.billing_address, 'billing');
      if (!useShippingAsBilling) checkAddress(formData.shipping_address!, 'shipping');
      if (!formData.pickuptime) errors.pickuptime = 'Por favor selecciona un horario';
    }

    if (step === 'payment') {
      if (!formData.credit_card.cardholder_name.trim()) errors.cardholder_name = 'El nombre del titular es requerido';
      if (!formData.credit_card.card_number.trim()) errors.card_number = 'El número de tarjeta es requerido';
      else if (!validateCard(formData.credit_card.card_number)) errors.card_number = 'Número de tarjeta inválido';
      if (!formData.credit_card.expiration_date.trim()) errors.expiration_date = 'La fecha de vencimiento es requerida';
      else if (!/^\d{2}\/\d{2}$/.test(formData.credit_card.expiration_date)) errors.expiration_date = 'Usa el formato MM/YY';
      if (!formData.credit_card.cvv.trim()) errors.cvv = 'El CVV es requerido';
      else if (!/^\d{3,4}$/.test(formData.credit_card.cvv)) errors.cvv = 'El CVV debe tener 3-4 dígitos';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [step, formData, useShippingAsBilling]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setError(null);

    setFormData(prev => {
      if (name.startsWith('card_')) return { ...prev, credit_card: { ...prev.credit_card, [name.replace('card_', '')]: value } };
      if (name.startsWith('billing_')) return { ...prev, billing_address: { ...prev.billing_address, [name.replace('billing_', '')]: value } };
      if (name.startsWith('shipping_')) return { ...prev, shipping_address: { ...prev.shipping_address!, [name.replace('shipping_', '')]: value } };
      return { ...prev, [name]: value };
    });

    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [formErrors]);

  const handleNextStep = useCallback(() => {
    if (!validateStep()) return;
    const steps: CheckoutStep[] = ['contact', 'shipping', 'payment', 'review'];
    setStep(prev => steps[steps.indexOf(prev) + 1] || prev);
  }, [validateStep]);

  const handlePrevStep = useCallback(() => {
    const steps: CheckoutStep[] = ['contact', 'shipping', 'payment', 'review'];
    setStep(prev => steps[steps.indexOf(prev) - 1] || prev);
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const service = new CheckoutService(process.env.NEXT_PUBLIC_API_URL || '');
      await service.executeCheckout({ ...formData, shipping_address: useShippingAsBilling ? undefined : formData.shipping_address });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    step, loading, submitting, error, success, checkoutData, formErrors, formData,
    useShippingAsBilling, totalAmount,
    setUseShippingAsBilling, handleInputChange, handleNextStep, handlePrevStep, handleSubmit
  };
}

// ============================================================================
// CAPA DE PRESENTACIÓN (UI)
// ============================================================================

export default function CheckoutPage() {
  const {
    step, loading, submitting, error, success, checkoutData, formErrors, formData,
    useShippingAsBilling, totalAmount,
    setUseShippingAsBilling, handleInputChange, handleNextStep, handlePrevStep, handleSubmit
  } = useCheckoutLogic();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando plataforma de pago...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border-2 border-blue-600 rounded-2xl shadow-sm p-8 text-center animate-in zoom-in duration-300">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/50">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">¡Orden Confirmada!</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Gracias por tu compra. Hemos procesado tu orden exitosamente y recibirás un correo de confirmación en breve.
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  const InputField = ({ label, name, type = 'text', value, placeholder = '', maxLength }: any) => (
    <div>
      <label className="block text-sm font-medium leading-6 text-gray-900">{label}</label>
      <div className="mt-2 relative">
        <input
          type={type} name={name} value={value} onChange={handleInputChange} placeholder={placeholder} maxLength={maxLength}
          className={`block w-full rounded-xl border-0 py-2.5 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset transition-all duration-200 ${
            formErrors[name] ? 'ring-red-300 focus:ring-red-500 bg-red-50/50' : 'ring-gray-300 focus:ring-blue-600 hover:ring-gray-400'
          } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
        />
        {formErrors[name] && <p className="absolute -bottom-5 left-0 text-xs text-red-600">{formErrors[name]}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header con Inyección de Logo Institucional y Brand Text */}
        <div className="mb-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center justify-center gap-5 rounded-2xl bg-[#002d62] px-6 py-4 shadow-sm">
            <Image 
              src="/image/logo_uasd.svg" 
              alt="UASD Logo" 
              width={160} 
              height={45} 
              className="h-10 w-auto object-contain"
              priority 
            />
            {/* Separador vertical para jerarquía visual */}
            <div className="h-8 w-px bg-white/20"></div>
            {/* Texto de Identidad */}
            <div className="flex flex-col justify-center">
              <span className="font-serif text-lg font-bold tracking-widest text-white leading-tight">
                BUYFAST
              </span>
              <span className="text-[10px] font-medium tracking-[0.2em] text-[#abc7ff] leading-none uppercase">
                ECONÓMATO
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Finalizar Compra</h1>
          <p className="mt-2 text-sm text-gray-500">Completa la información a continuación para procesar tu pedido.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10">
          <div className="lg:col-span-8">
            <div className="bg-white border-2 border-blue-600 rounded-3xl shadow-sm p-6 sm:p-10">
              
              {/* Stepper Moderno */}
              <div className="mb-12">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 top-1/2 -mt-px h-0.5 w-full bg-gray-100" aria-hidden="true" />
                  {(['contact', 'shipping', 'payment', 'review'] as const).map((s, idx) => {
                    const isCompleted = ['contact', 'shipping', 'payment', 'review'].indexOf(s) < ['contact', 'shipping', 'payment', 'review'].indexOf(step);
                    const isCurrent = s === step;
                    return (
                      <div key={s} className="relative flex items-center justify-center bg-white px-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                          isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-50' : isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-200'
                        }`}>
                          {isCompleted ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : idx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="mb-8 rounded-xl bg-red-50 p-4 ring-1 ring-inset ring-red-200/50">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              )}

              {/* Contenido Dinámico de Pasos */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                
                {step === 'contact' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-semibold leading-7 text-gray-900">Información de Contacto</h2>
                      <p className="mt-1 text-sm text-gray-500">Utilizaremos este correo para enviar tu recibo.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                      <InputField label="Nombres" name="firstname" value={formData.firstname} />
                      <InputField label="Apellidos" name="lastname" value={formData.lastname} />
                      <div className="sm:col-span-2"><InputField label="Correo Electrónico" name="email" type="email" value={formData.email} /></div>
                      <div className="sm:col-span-2"><InputField label="Número de Teléfono" name="phone" type="tel" value={formData.phone} /></div>
                    </div>
                  </div>
                )}

                {step === 'shipping' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-semibold leading-7 text-gray-900">Envío & Recogida</h2>
                      <p className="mt-1 text-sm text-gray-500">Selecciona el horario y la dirección de facturación.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium leading-6 text-gray-900">Horario de Recogida</label>
                        <select name="pickuptime" value={formData.pickuptime} onChange={handleInputChange} className={`mt-2 block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${formErrors.pickuptime ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-blue-600'} focus:ring-2 sm:text-sm`}>
                          <option value="">Selecciona un horario disponible...</option>
                          {checkoutData?.data.pickup_times.map(slot => (
                            <option key={`${slot.date}-${slot.time}`} value={`${slot.date} ${slot.time}`} disabled={!slot.available}>
                              {slot.date} a las {slot.time} {!slot.available && '(No Disponible)'}
                            </option>
                          ))}
                        </select>
                        {formErrors.pickuptime && <p className="mt-1 text-xs text-red-600">{formErrors.pickuptime}</p>}
                      </div>

                      <div className="sm:col-span-2 pt-4 border-b border-gray-100 pb-2"><h3 className="text-sm font-semibold text-gray-900">Dirección de Facturación</h3></div>
                      <div className="sm:col-span-2"><InputField label="Dirección" name="billing_street" value={formData.billing_address.street} /></div>
                      <InputField label="Ciudad" name="billing_city" value={formData.billing_address.city} />
                      <InputField label="Provincia / Estado" name="billing_state" value={formData.billing_address.state} />
                      <InputField label="Código Postal" name="billing_postal_code" value={formData.billing_address.postal_code} />
                      <InputField label="País" name="billing_country" value={formData.billing_address.country} />

                      <div className="sm:col-span-2 pt-2">
                        <label className="relative flex items-start cursor-pointer group">
                          <div className="flex h-6 items-center">
                            <input type="checkbox" checked={useShippingAsBilling} onChange={e => setUseShippingAsBilling(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 transition-all cursor-pointer" />
                          </div>
                          <div className="ml-3 text-sm leading-6">
                            <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Misma dirección para envíos</span>
                            <p className="text-gray-500">Usa la dirección de facturación proporcionada para la entrega.</p>
                          </div>
                        </label>
                      </div>

                      {!useShippingAsBilling && (
                        <>
                          <div className="sm:col-span-2 pt-4 border-b border-gray-100 pb-2"><h3 className="text-sm font-semibold text-gray-900">Dirección de Envío</h3></div>
                          <div className="sm:col-span-2"><InputField label="Dirección" name="shipping_street" value={formData.shipping_address?.street || ''} /></div>
                          <InputField label="Ciudad" name="shipping_city" value={formData.shipping_address?.city || ''} />
                          <InputField label="Provincia / Estado" name="shipping_state" value={formData.shipping_address?.state || ''} />
                          <InputField label="Código Postal" name="shipping_postal_code" value={formData.shipping_address?.postal_code || ''} />
                          <InputField label="País" name="shipping_country" value={formData.shipping_address?.country || ''} />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {step === 'payment' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-semibold leading-7 text-gray-900">Método de Pago</h2>
                      <p className="mt-1 text-sm text-gray-500">Tus datos de pago están encriptados de forma segura.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                      <div className="sm:col-span-2"><InputField label="Nombre en la tarjeta" name="card_cardholder_name" value={formData.credit_card.cardholder_name} /></div>
                      <div className="sm:col-span-2"><InputField label="Número de la tarjeta" name="card_card_number" value={formData.credit_card.card_number} maxLength={19} /></div>
                      <InputField label="Expiración (MM/AA)" name="card_expiration_date" value={formData.credit_card.expiration_date} placeholder="MM/AA" maxLength={5} />
                      <InputField label="CVC" name="card_cvv" value={formData.credit_card.cvv} maxLength={4} />
                    </div>
                  </div>
                )}

                {step === 'review' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-semibold leading-7 text-gray-900">Revisión Final</h2>
                      <p className="mt-1 text-sm text-gray-500">Por favor, revisa los detalles antes de completar el pedido.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Contacto</h4>
                          <p className="text-sm font-medium text-gray-900">{formData.firstname} {formData.lastname}</p>
                          <p className="text-sm text-gray-600 mt-1">{formData.email}</p>
                          <p className="text-sm text-gray-600">{formData.phone}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Horario de Recogida</h4>
                          <p className="text-sm font-medium text-gray-900 bg-white border border-gray-200 py-1.5 px-3 rounded-lg w-fit shadow-sm">{formData.pickuptime}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Dirección de Facturación</h4>
                          <p className="text-sm font-medium text-gray-900">{formData.billing_address.street}</p>
                          <p className="text-sm text-gray-600 mt-1">{formData.billing_address.city}, {formData.billing_address.state} {formData.billing_address.postal_code}</p>
                          <p className="text-sm text-gray-600">{formData.billing_address.country}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Método de Pago</h4>
                          <div className="flex items-center text-sm font-medium text-gray-900 bg-white border border-gray-200 py-2.5 px-4 rounded-xl w-fit shadow-sm">
                            <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                            •••• •••• •••• {formData.credit_card.card_number.slice(-4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Control de Flujo */}
              <div className="mt-12 flex items-center justify-between border-t border-gray-100 pt-8">
                <button
                  type="button" onClick={handlePrevStep} disabled={step === 'contact'}
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-blue-600"
                >
                  Regresar
                </button>

                {step !== 'review' ? (
                  <button type="button" onClick={handleNextStep} className="rounded-xl bg-gray-900 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
                    Continuar
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
                    {submitting && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {submitting ? 'Procesando...' : 'Confirmar Orden'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Resumen */}
          {checkoutData && (
            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="bg-white border-2 border-blue-600 rounded-3xl shadow-sm p-6 sm:p-8 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumen del Pedido</h3>
                <div className="flow-root mb-6">
                  <ul role="list" className="-my-6 divide-y divide-gray-100 max-h-[28rem] overflow-y-auto pr-4 custom-scrollbar">
                    {checkoutData.data.cart.items.map(item => (
                      <li key={item.id} className="flex py-6">
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between text-sm font-medium text-gray-900">
                            <h4 className="line-clamp-2 pr-4">{item.productvariant.name}</h4>
                            <p className="ml-4 whitespace-nowrap">${(item.productvariant.selling_price * item.quantity).toFixed(2)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">Cant. {item.quantity}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <dt className="text-gray-600">Subtotal</dt>
                    <dd className="font-medium text-gray-900">${totalAmount.toFixed(2)}</dd>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <dt className="text-gray-600">Envío</dt>
                    <dd className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Gratis</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <dt className="text-base font-bold text-gray-900">Total a Pagar</dt>
                    <dd className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</dd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}