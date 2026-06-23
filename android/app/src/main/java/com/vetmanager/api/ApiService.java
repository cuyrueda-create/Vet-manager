package com.vetmanager.api;

import com.vetmanager.models.Cliente;
import com.vetmanager.models.Usuario;
import java.util.List;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Header;

public interface ApiService {
    // Login
    @POST("auth/register")
    Call<RegisterResponse> register(@Body RegisterRequest request);

    // Registro
    @POST("auth/register")
    Call<RegisterResponse> register(@Body RegisterRequest request);

    // Lista de clientes
    @GET("api/v1/clientes/")
    Call<List<Cliente>> getClientes(@Header("Authorization") String token);

    // ==================== CLASES AUXILIARES ====================

    class LoginRequest {
        public String email;
        public String contraseña;
    }

    class LoginResponse {
        public String access_token;
        public String token_type;
        public Usuario user;
    }

    class RegisterRequest {
        public String nombre;
        public String apellido;
        public String email;
        public String contraseña;
        public String rol;
    }

    class RegisterResponse {
        public String message;
        public int user_id;
    }
}