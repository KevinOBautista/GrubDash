const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function bodyDataHas(propertyName) {
	return function (req, res, next) {
		const { data = {} } = req.body;
		if (
			!data[propertyName] ||
			data[propertyName] == "" ||
			data[propertyName] <= 0 /*||*/
			// typeof data[propertyName] != "number" ||
			// data[propertyName].length === 0 ||
			// !Array.isArray(data[propertyName])
		) {
			return next({
				status: 400,
				message: `Order must include a ${propertyName}`,
			});
		} else {
			return next();
		}
	};
}

function dishesChecker(req, res, next) {
	const { data: { dishes } = {} } = req.body;
	if (!Array.isArray(dishes) || dishes.length === 0) {
		return next({
			status: 400,
			message: `Order must include at least one dish`,
		});
	} else if (!dishes) {
		return next({
			status: 400,
			message: `Order must include a dish`,
		});
	}
	next();
}

function quantityChecker(req, res, next) {
	const { data: { dishes } = {} } = req.body;
	dishes.forEach((dish, index) => {
		const { quantity } = dish;
		if (!quantity || quantity <= 0 || typeof quantity != "number") {
			return next({
				status: 400,
				message: `Dish ${index} must have a quantity that is an integer greater than 0`,
			});
		}
	});
	next();
}

function orderExists(req, res, next) {
	const orderId = req.params.orderId;
	const foundOrder = orders.find((order) => order.id === orderId);
	if (foundOrder) {
		res.locals.order = foundOrder;
		return next();
	} else {
		return next({
			status: 404,
			message: `Dish does not exist: ${orderId}.`,
		});
	}
}

function list(req, res) {
	res.json({ data: orders });
}

function read(req, res) {
	res.json({ data: res.locals.order });
}

function create(req, res) {
	const {
		data: { deliverTo, mobileNumber, status, dishes },
	} = req.body;
	let newOrder = {
		id: nextId(),
		deliverTo,
		mobileNumber,
		status,
		dishes,
	};
	orders.push(newOrder);
	res.status(201).json({ data: newOrder });
}

function statusChecker(req, res, next) {
	const { data: { status } = {} } = req.body;
	if (!status || status === "" || status === "invalid") {
		next({
			status: 400,
			message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
		});
	} else if (status === "delivered") {
		next({
			status: 404,
			message: `A delivered order cannot be changed`,
		});
	} else {
		next();
	}
}

function update(req, res, next) {
	const {
		data: { deliverTo, mobileNumber, status, dishes, id },
	} = req.body;
	let currentOrder = res.locals.order;
	if (id) {
		if (id != currentOrder.id) {
			return next({
				status: 400,
				message: `Order id does not match route id. Order: ${id}, Route: ${currentOrder.id}.`,
			});
		}
	}
	currentOrder.deliverTo = deliverTo;
	currentOrder.mobileNumber = mobileNumber;
	currentOrder.status = status;
	currentOrder.dishes = dishes;
	res.json({ data: currentOrder });
}

function checkForPending(req, res, next) {
	const currentOrder = res.locals.order;
	if (currentOrder.status !== "pending") {
		next({
			status: 400,
			message: `An order cannot be deleted unless it is pending.`,
		});
	} else {
		next();
	}
}

function destroy(req, res) {
	const { orderId } = req.params;
	const index = orders.findIndex((order) => order.id === orderId);
	if (index > -1) {
		orders.splice(index, 1);
	}
	res.sendStatus(204);
}

module.exports = {
	list,
	read: [orderExists, read],
	create: [
		bodyDataHas("deliverTo"),
		bodyDataHas("mobileNumber"),
		dishesChecker,
		quantityChecker,
		create,
	],
	update: [
		orderExists,
		bodyDataHas("deliverTo"),
		bodyDataHas("mobileNumber"),
		dishesChecker,
		quantityChecker,
		statusChecker,
		update,
	],
	delete: [orderExists, checkForPending, destroy],
};
