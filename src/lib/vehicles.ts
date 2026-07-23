// Vehicle planning: one tuk-tuk seats up to 3 guests, and the guide always
// drives their own separate vehicle (not counted against the 3-per-vehicle
// ratio) whenever a guide is covering the departure.
const GUESTS_PER_VEHICLE = 3;

export function calcVehiclesNeeded(guestCount: number, hasGuide: boolean) {
  const customerVehicles = guestCount > 0 ? Math.ceil(guestCount / GUESTS_PER_VEHICLE) : 0;
  const guideVehicles = hasGuide ? 1 : 0;
  return {
    customerVehicles,
    guideVehicles,
    total: customerVehicles + guideVehicles,
  };
}
