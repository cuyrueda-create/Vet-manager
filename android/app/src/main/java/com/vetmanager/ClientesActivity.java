package com.vetmanager;

import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.vetmanager.api.ApiClient;
import com.vetmanager.api.ApiService;
import com.vetmanager.models.Cliente;
import com.vetmanager.utils.TokenManager;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ClientesActivity extends AppCompatActivity {
    private ListView clientesListView;
    private Button refreshButton, backButton;
    private ArrayAdapter<String> adapter;
    private List<String> clientesList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_clientes);

        clientesListView = findViewById(R.id.clientesListView);
        refreshButton = findViewById(R.id.refreshButton);
        backButton = findViewById(R.id.backButton);

        adapter = new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, clientesList);
        clientesListView.setAdapter(adapter);

        refreshButton.setOnClickListener(v -> loadClientes());
        backButton.setOnClickListener(v -> finish());

        loadClientes();
    }

    private void loadClientes() {
        String token = TokenManager.getToken(this);
        if (token == null) {
            Toast.makeText(this, "Sesión expirada", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        ApiService service = ApiClient.getClient().create(ApiService.class);
        Call<List<Cliente>> call = service.getClientes("Bearer " + token);

        call.enqueue(new Callback<List<Cliente>>() {
            @Override
            public void onResponse(Call<List<Cliente>> call, Response<List<Cliente>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    clientesList.clear();
                    for (Cliente c : response.body()) {
                        clientesList.add("🐾 " + c.getNombre() + " " + c.getApellido() +
                                "\n📧 " + (c.getEmail() != null ? c.getEmail() : "Sin email") +
                                "\n📱 " + (c.getTelefono() != null ? c.getTelefono() : "Sin teléfono"));
                    }
                    adapter.notifyDataSetChanged();
                } else {
                    Toast.makeText(ClientesActivity.this, "Error al cargar clientes", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<Cliente>> call, Throwable t) {
                Toast.makeText(ClientesActivity.this, "Error de conexión: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}