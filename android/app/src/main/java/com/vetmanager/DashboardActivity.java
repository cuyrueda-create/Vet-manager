package com.vetmanager;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.vetmanager.api.ApiClient;
import com.vetmanager.api.ApiService;
import com.vetmanager.models.Usuario;
import com.vetmanager.utils.TokenManager;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {
    private TextView welcomeText, userEmailText, userRolText;
    private Button clientesButton, logoutButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        // Conectar views
        welcomeText = findViewById(R.id.welcomeText);
        userEmailText = findViewById(R.id.userEmailText);
        userRolText = findViewById(R.id.userRolText);
        clientesButton = findViewById(R.id.clientesButton);
        logoutButton = findViewById(R.id.logoutButton);

        // Cargar datos del usuario
        loadUserData();

        clientesButton.setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, ClientesActivity.class));
        });

        logoutButton.setOnClickListener(v -> {
            TokenManager.clearToken(DashboardActivity.this);
            startActivity(new Intent(DashboardActivity.this, LoginActivity.class));
            finish();
            Toast.makeText(this, "Sesión cerrada", Toast.LENGTH_SHORT).show();
        });
    }

    private void loadUserData() {
        String token = TokenManager.getToken(this);
        if (token == null) {
            logout();
            return;
        }

        ApiService service = ApiClient.getClient().create(ApiService.class);
        Call<ApiService.LoginResponse> call = service.getUserInfo("Bearer " + token);

        call.enqueue(new Callback<ApiService.LoginResponse>() {
            @Override
            public void onResponse(Call<ApiService.LoginResponse> call, Response<ApiService.LoginResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Usuario user = response.body().user;
                    welcomeText.setText("¡Bienvenido, " + user.getNombre() + "!");
                    userEmailText.setText("📧 " + user.getEmail());
                    userRolText.setText("🔑 Rol: " + user.getRol());
                }
            }

            @Override
            public void onFailure(Call<ApiService.LoginResponse> call, Throwable t) {
                Toast.makeText(DashboardActivity.this, "Error al cargar datos", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void logout() {
        TokenManager.clearToken(this);
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }
}