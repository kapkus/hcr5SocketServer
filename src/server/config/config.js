module.exports = {
    API: {
        HOST: process.env.API_HOST || '127.0.0.1'
    },
    JWT: {
        SECRET: process.env.JWT_SECRET,
        JWT_EXPIRE_TIME: process.env.JWT_EXPIRE_TIME || '365d'
    },
    MONGO: {
        URI: process.env.MONGO_URI,
    },
    TCP_LIDAR_SERVER: {
        HOST: process.env.LIDAR_TCP_HOST || '0.0.0.0',
        PORT: process.env.LIDAR_TCP_PORT || 8002
    },

    CONSTANT: {
        HTTP_RESPONSE_CODE: {
            SUCCESS: 200,
            CREATED: 201,
            BAD_REQUEST: 400,
            UNAUTHORIZED: 401,
            NOT_FOUND: 404,
            INTERNAL_ERROR: 500
        }
    }
}