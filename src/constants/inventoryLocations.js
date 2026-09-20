/*
|--------------------------------------------------------------------------
| INVENTORY LOCATION CONSTANTS & HELPERS
|--------------------------------------------------------------------------
|
| Database stores stable codes: LOCATION_A and LOCATION_B.
| User-facing display names are Vidisha and Manawar.
|
*/

export const INVENTORY_LOCATIONS = {
  LOCATION_A: "LOCATION_A",
  LOCATION_B: "LOCATION_B",
};

export const INVENTORY_LOCATION_VALUES = Object.values(INVENTORY_LOCATIONS);

export const INVENTORY_LOCATION_NAMES = {
  LOCATION_A: "Vidisha",
  LOCATION_B: "Manawar",
};

export const getInventoryLocationName = (locationCode) =>
  INVENTORY_LOCATION_NAMES[locationCode] || locationCode;
