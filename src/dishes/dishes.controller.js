const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function bodyDataHas(propertyName) {
	return function (req, res, next) {
		const { data = {} } = req.body;
		if (!data[propertyName] || data[propertyName] === "") {
			return next({
				status: 400,
				message: `Dish must include a ${propertyName}`,
			});
		} else {
			return next();
		}
	};
}

function priceChecker(req, res, next) {
	const { data = {} } = req.body;
	if (typeof data["price"] != "number" || data["price"] <= 0) {
		return next({
			status: 400,
			message: `Dish must have a price that is an integer greater than 0`,
		});
	} else {
		next();
	}
}

function dishExists(req, res, next) {
	const dishId = req.params.dishId;
	const foundDish = dishes.find((dish) => dish.id === dishId);
	if (foundDish) {
		res.locals.dish = foundDish;
		return next();
	} else {
		return next({
			status: 404,
			message: `Dish does not exist: ${dishId}.`,
		});
	}
}

function list(req, res) {
	res.json({ data: dishes });
}

function read(req, res) {
	res.json({ data: res.locals.dish });
}

function create(req, res) {
	const {
		data: { name, description, price, image_url },
	} = req.body;
	const newDish = {
		id: nextId(),
		name,
		description,
		price,
		image_url,
	};
	dishes.push(newDish);
	res.status(201).json({ data: newDish });
}

function update(req, res, next) {
	const {
		data: { name, description, price, image_url, id },
	} = req.body;
	let currentDish = res.locals.dish;
	if (id) {
		if (id !== currentDish.id) {
			return next({
				status: 400,
				message: `Dish id does not match route id. Dish: ${id}, Route: ${currentDish.id}`,
			});
		}
	}
	currentDish.name = name;
	currentDish.description = description;
	currentDish.price = price;
	currentDish.image_url = image_url;
	res.json({ data: currentDish });
}

module.exports = {
	list,
	read: [dishExists, read],
	create: [
		bodyDataHas("name"),
		bodyDataHas("description"),
		priceChecker,
		bodyDataHas("image_url"),
		create,
	],
	update: [
		dishExists,
		bodyDataHas("name"),
		bodyDataHas("description"),
		priceChecker,
		bodyDataHas("image_url"),
		update,
	],
};
