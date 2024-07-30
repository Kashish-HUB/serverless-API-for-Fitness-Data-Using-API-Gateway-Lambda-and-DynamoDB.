import aws from 'aws-sdk';

const dynamo = new aws.DynamoDB.DocumentClient();
const tableName = 'Users';

export const handler = async (event) =>
{
	const httpMethod = event.httpMethod;
	let response;

	switch (httpMethod)
	{
		case 'GET':
			const username = event.queryStringParameters ? event.queryStringParameters.username : null;
			if (username)
			{
				response = await getUser(username);
			} else
			{
				response = {
					statusCode: 400,
					body: JSON.stringify({ message: 'Missing username in query parameters' })
				};
			}
			break;
		case 'POST':
			const user = JSON.parse(event.body);
			response = await createUser(user);
			break;
		default:
			response = {
				statusCode: 405,
				body: JSON.stringify({ message: `Unsupported method ${httpMethod}` })
			};
			break;
	}

	return response;
};

const getUser = async (username) =>
{
	const params = {
		TableName: tableName,
		Key: { UserId: username }
	};

	try
	{
		const data = await dynamo.get(params).promise();
		if (data.Item)
		{
			const { Height, Weight } = data.Item;
			const bmi = calculateBMI(Height, Weight);
			return {
				statusCode: 200,
				body: JSON.stringify({ Height, Weight, BMI: bmi })
			};
		} else
		{
			return {
				statusCode: 404,
				body: JSON.stringify({ message: 'User not found' })
			};
		}
	} catch (error)
	{
		return {
			statusCode: 500,
			body: JSON.stringify({ message: error.message })
		};
	}
};

const createUser = async (user) =>
{
	const params = {
		TableName: tableName,
		Item: user
	};

	try
	{
		await dynamo.put(params).promise();
		return {
			statusCode: 201,
			body: JSON.stringify(user)
		};
	} catch (error)
	{
		return {
			statusCode: 500,
			body: JSON.stringify({ message: error.message })
		};
	}
};

const calculateBMI = (height, weight) =>
{
	const heightInMeters = height / 100; // Assuming height is in cm
	return (weight / (heightInMeters * heightInMeters)).toFixed(2);
};
