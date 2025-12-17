# 小红书SDK后端接口实现示例

本文档提供了小红书SDK所需的后端接口实现示例，包括获取access_token和生成分享签名的完整实现。

## 📋 接口清单

### 1. 获取access_token接口

**接口地址**: `POST /api/xhs/auth/token`

**请求参数**:
```json
{
  "nonce": "随机字符串",
  "timestamp": 1234567890,
  "expires_in": 7200
}
```

**响应数据**:
```json
{
  "access_token": "生成的访问令牌",
  "expires_in": 7200
}
```

### 2. 获取分享签名接口

**接口地址**: `POST /api/xhs/share/signature`

**请求参数**:
```json
{
  "appKey": "应用Key",
  "nonce": "随机字符串",
  "timestamp": "时间戳字符串"
}
```

**响应数据**:
```json
{
  "appKey": "应用Key",
  "nonce": "随机字符串",
  "timestamp": "时间戳字符串",
  "signature": "生成的签名"
}
```

## 🔧 Java实现示例

### 1. 签名工具类

```java
package com.example.xhs.util;

import org.apache.commons.codec.digest.DigestUtils;
import java.util.Arrays;

/**
 * 小红书签名工具类
 */
public class XhsSignatureUtil {
    
    /**
     * 生成签名
     * @param nonce 随机字符串
     * @param timeStamp 时间戳
     * @param appKey 应用Key
     * @param secret 密钥（appSecret或access_token）
     * @return 签名字符串
     */
    public static String generateSignature(String nonce, String timeStamp, String appKey, String secret) {
        String string1 = buildSignature(nonce, timeStamp, appKey, secret);
        return DigestUtils.sha256Hex(string1);
    }
    
    /**
     * 构建待签名字符串
     * @param nonce 随机字符串
     * @param timeStamp 时间戳
     * @param appKey 应用Key
     * @param secret 密钥
     * @return 待签名字符串
     */
    private static String buildSignature(String nonce, String timeStamp, String appKey, String secret) {
        String[] array = {nonce, timeStamp, appKey, secret};
        Arrays.sort(array);
        StringBuilder sb = new StringBuilder();
        for (String s : array) {
            sb.append(s);
        }
        return sb.toString();
    }
    
    /**
     * 生成随机字符串
     * @param length 长度
     * @return 随机字符串
     */
    public static String generateNonce(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            int index = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(index));
        }
        return sb.toString();
    }
}
```

### 2. 配置类

```java
package com.example.xhs.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 小红书配置
 */
@Component
@ConfigurationProperties(prefix = "xhs")
public class XhsConfig {
    
    private String appKey;
    private String appSecret;
    private String tokenUrl = "https://edith.xiaohongshu.com/api/sns/v1/ext/access/token";
    private int tokenExpireTime = 7200; // 2小时
    
    // getter和setter方法
    public String getAppKey() {
        return appKey;
    }
    
    public void setAppKey(String appKey) {
        this.appKey = appKey;
    }
    
    public String getAppSecret() {
        return appSecret;
    }
    
    public void setAppSecret(String appSecret) {
        this.appSecret = appSecret;
    }
    
    public String getTokenUrl() {
        return tokenUrl;
    }
    
    public void setTokenUrl(String tokenUrl) {
        this.tokenUrl = tokenUrl;
    }
    
    public int getTokenExpireTime() {
        return tokenExpireTime;
    }
    
    public void setTokenExpireTime(int tokenExpireTime) {
        this.tokenExpireTime = tokenExpireTime;
    }
}
```

### 3. 数据传输对象

```java
package com.example.xhs.dto;

/**
 * 获取token请求
 */
public class XhsTokenRequest {
    private String nonce;
    private Long timestamp;
    private Integer expiresIn;
    
    // 构造函数、getter和setter
    public XhsTokenRequest() {}
    
    public String getNonce() {
        return nonce;
    }
    
    public void setNonce(String nonce) {
        this.nonce = nonce;
    }
    
    public Long getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
    
    public Integer getExpiresIn() {
        return expiresIn;
    }
    
    public void setExpiresIn(Integer expiresIn) {
        this.expiresIn = expiresIn;
    }
}

/**
 * 获取token响应
 */
public class XhsTokenResponse {
    private String accessToken;
    private Integer expiresIn;
    
    public XhsTokenResponse() {}
    
    public XhsTokenResponse(String accessToken, Integer expiresIn) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
    }
    
    public String getAccessToken() {
        return accessToken;
    }
    
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
    
    public Integer getExpiresIn() {
        return expiresIn;
    }
    
    public void setExpiresIn(Integer expiresIn) {
        this.expiresIn = expiresIn;
    }
}

/**
 * 获取签名请求
 */
public class XhsSignatureRequest {
    private String appKey;
    private String nonce;
    private String timestamp;
    
    // 构造函数、getter和setter
    public XhsSignatureRequest() {}
    
    public String getAppKey() {
        return appKey;
    }
    
    public void setAppKey(String appKey) {
        this.appKey = appKey;
    }
    
    public String getNonce() {
        return nonce;
    }
    
    public void setNonce(String nonce) {
        this.nonce = nonce;
    }
    
    public String getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}

/**
 * 获取签名响应
 */
public class XhsSignatureResponse {
    private String appKey;
    private String nonce;
    private String timestamp;
    private String signature;
    
    public XhsSignatureResponse() {}
    
    public XhsSignatureResponse(String appKey, String nonce, String timestamp, String signature) {
        this.appKey = appKey;
        this.nonce = nonce;
        this.timestamp = timestamp;
        this.signature = signature;
    }
    
    // getter和setter方法
    public String getAppKey() {
        return appKey;
    }
    
    public void setAppKey(String appKey) {
        this.appKey = appKey;
    }
    
    public String getNonce() {
        return nonce;
    }
    
    public void setNonce(String nonce) {
        this.nonce = nonce;
    }
    
    public String getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getSignature() {
        return signature;
    }
    
    public void setSignature(String signature) {
        this.signature = signature;
    }
}
```

### 4. 服务类

```java
package com.example.xhs.service;

import com.example.xhs.config.XhsConfig;
import com.example.xhs.dto.*;
import com.example.xhs.util.XhsSignatureUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 小红书服务类
 */
@Service
public class XhsService {
    
    @Autowired
    private XhsConfig xhsConfig;
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    @Autowired
    private RestTemplate restTemplate;
    
    private static final String ACCESS_TOKEN_KEY = "xhs:access_token";
    
    /**
     * 获取access_token
     */
    public XhsTokenResponse getAccessToken(XhsTokenRequest request) {
        try {
            // 检查缓存中是否有有效的token
            String cachedToken = redisTemplate.opsForValue().get(ACCESS_TOKEN_KEY);
            if (cachedToken != null) {
                return new XhsTokenResponse(cachedToken, xhsConfig.getTokenExpireTime());
            }
            
            // 生成签名
            String nonce = request.getNonce();
            String timestamp = String.valueOf(request.getTimestamp());
            String signature = XhsSignatureUtil.generateSignature(
                nonce, timestamp, xhsConfig.getAppKey(), xhsConfig.getAppSecret()
            );
            
            // 构建请求参数
            Map<String, Object> params = new HashMap<>();
            params.put("app_key", xhsConfig.getAppKey());
            params.put("nonce", nonce);
            params.put("timestamp", request.getTimestamp());
            params.put("signature", signature);
            if (request.getExpiresIn() != null) {
                params.put("expires_in", request.getExpiresIn());
            }
            
            // 发送请求到小红书API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(params, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                xhsConfig.getTokenUrl(), entity, Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String accessToken = (String) responseBody.get("access_token");
                Integer expiresIn = (Integer) responseBody.get("expires_in");
                
                // 缓存token（提前5分钟过期）
                redisTemplate.opsForValue().set(
                    ACCESS_TOKEN_KEY, accessToken, 
                    expiresIn - 300, TimeUnit.SECONDS
                );
                
                return new XhsTokenResponse(accessToken, expiresIn);
            } else {
                throw new RuntimeException("获取access_token失败");
            }
        } catch (Exception e) {
            throw new RuntimeException("获取access_token异常: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取分享签名
     */
    public XhsSignatureResponse getShareSignature(XhsSignatureRequest request) {
        try {
            // 获取access_token
            String accessToken = redisTemplate.opsForValue().get(ACCESS_TOKEN_KEY);
            if (accessToken == null) {
                // 如果没有缓存的token，重新获取
                XhsTokenRequest tokenRequest = new XhsTokenRequest();
                tokenRequest.setNonce(XhsSignatureUtil.generateNonce(16));
                tokenRequest.setTimestamp(System.currentTimeMillis() / 1000);
                XhsTokenResponse tokenResponse = getAccessToken(tokenRequest);
                accessToken = tokenResponse.getAccessToken();
            }
            
            // 使用access_token生成签名
            String signature = XhsSignatureUtil.generateSignature(
                request.getNonce(),
                request.getTimestamp(),
                request.getAppKey(),
                accessToken
            );
            
            return new XhsSignatureResponse(
                request.getAppKey(),
                request.getNonce(),
                request.getTimestamp(),
                signature
            );
        } catch (Exception e) {
            throw new RuntimeException("获取分享签名异常: " + e.getMessage(), e);
        }
    }
}
```

### 5. 控制器

```java
package com.example.xhs.controller;

import com.example.xhs.dto.*;
import com.example.xhs.service.XhsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 小红书API控制器
 */
@RestController
@RequestMapping("/api/xhs")
@CrossOrigin(origins = "*") // 根据实际需要配置CORS
public class XhsController {
    
    @Autowired
    private XhsService xhsService;
    
    /**
     * 获取access_token
     */
    @PostMapping("/auth/token")
    public ResponseEntity<XhsTokenResponse> getAccessToken(@RequestBody XhsTokenRequest request) {
        try {
            XhsTokenResponse response = xhsService.getAccessToken(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 获取分享签名
     */
    @PostMapping("/share/signature")
    public ResponseEntity<XhsSignatureResponse> getShareSignature(@RequestBody XhsSignatureRequest request) {
        try {
            XhsSignatureResponse response = xhsService.getShareSignature(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
```

## 📝 配置文件

### application.yml (Spring Boot)

```yaml
xhs:
  app-key: ${XHS_APP_KEY:your_app_key_here}
  app-secret: ${XHS_APP_SECRET:your_app_secret_here}
  token-url: https://edith.xiaohongshu.com/api/sns/v1/ext/access/token
  token-expire-time: 7200

spring:
  redis:
    host: localhost
    port: 6379
    database: 0
```

## 🚨 安全注意事项

1. **密钥安全**
   - `appSecret` 绝对不能暴露在前端代码中
   - 使用环境变量存储敏感信息
   - 定期轮换密钥

2. **接口安全**
   - 添加请求频率限制
   - 验证请求来源
   - 记录操作日志

3. **缓存安全**
   - access_token 应该安全存储
   - 设置合理的过期时间
   - 考虑使用加密存储

4. **错误处理**
   - 不要在错误信息中暴露敏感信息
   - 记录详细的错误日志用于调试
   - 返回统一的错误格式

## 🧪 测试

### 使用curl测试接口

```bash
# 测试获取access_token
curl -X POST http://localhost:8080/api/xhs/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "nonce": "test123456",
    "timestamp": 1234567890
  }'

# 测试获取分享签名
curl -X POST http://localhost:8080/api/xhs/share/signature \
  -H "Content-Type: application/json" \
  -d '{
    "appKey": "your_app_key",
    "nonce": "test123456",
    "timestamp": "1234567890"
  }'
```

这些示例代码提供了完整的后端实现，可以根据实际项目需求进行调整和优化。