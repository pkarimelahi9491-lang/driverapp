suspend fun login(
    username: String,
    password: String
): Result<Pair<String, String>> = withContext(Dispatchers.IO) {
    try {
        val response = api.login(LoginRequest(username, password))

        if (response.isSuccessful && response.body()?.success == true) {
            val data = response.body()!!.data
            Result.success(Pair(data.token, data.user.role))
        } else {
            val errorText = response.errorBody()?.string()

            Result.failure(
                Exception(
                    "HTTP ${response.code()}\n${errorText ?: response.body()?.message ?: "خطای نامشخص"}"
                )
            )
        }
    } catch (e: Exception) {
        Result.failure(
            Exception("خطای اتصال: ${e.message}")
        )
    }
}
