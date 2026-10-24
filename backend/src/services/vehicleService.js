const { ConflictError, NotFoundError } = require('../errors');
const {
  validateVehicleInput,
  parseVehicleId,
  validateStockAmount,
  parseSearchFilters,
} = require('../validators/vehicleValidator');

/** Business rules for vehicles and their inventory. */
class VehicleService {
  /** @param {VehicleRepository} vehicleRepository */
  constructor(vehicleRepository) {
    this.vehicleRepository = vehicleRepository;
  }

  list() {
    return this.vehicleRepository.findAll();
  }

  search(query) {
    return this.vehicleRepository.search(parseSearchFilters(query));
  }

  create(payload) {
    return this.vehicleRepository.create(validateVehicleInput(payload));
  }

  update(rawId, payload) {
    const id = parseVehicleId(rawId);
    const fields = validateVehicleInput(payload, { partial: true });
    this.getExisting(id);
    return this.vehicleRepository.update(id, fields);
  }

  remove(rawId) {
    const id = parseVehicleId(rawId);
    if (!this.vehicleRepository.delete(id)) {
      throw new NotFoundError('Vehicle not found');
    }
  }

  /** Sells `quantity` units (default 1), failing if stock is insufficient. */
  purchase(rawId, rawQuantity) {
    const id = parseVehicleId(rawId);
    const quantity = validateStockAmount(rawQuantity, 1);
    const vehicle = this.getExisting(id);

    if (!this.vehicleRepository.decrementStock(id, quantity)) {
      throw new ConflictError(
        vehicle.quantity === 0
          ? 'Vehicle is out of stock'
          : `Only ${vehicle.quantity} unit(s) in stock`
      );
    }
    return this.vehicleRepository.findById(id);
  }

  /** Adds `quantity` units of stock. */
  restock(rawId, rawQuantity) {
    const id = parseVehicleId(rawId);
    const quantity = validateStockAmount(rawQuantity);
    this.getExisting(id);

    this.vehicleRepository.incrementStock(id, quantity);
    return this.vehicleRepository.findById(id);
  }

  getExisting(id) {
    const vehicle = this.vehicleRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }
}

module.exports = VehicleService;
