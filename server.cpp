#include <sstream>
#include "libs\crow_all.h"


//Dumb random shape class, not actually spec
class Shape{
    public:
        bool isNew;
        // std::string type;
        std::string shape;
        std::string dim;
        std::string ID;
        double posX;
        double posY;
        bool isPlayer;
        std::string getJSON(){              //Json object of some architecture, not defined yet
            std::ostringstream ShapeJSON;
            ShapeJSON << "{\"isNew\":" << isNew << ", \"ID\":\"" << ID << "\", \"shape\":\"" << shape << "\", \"dim\":" << dim << ", \"pos\":[" << posX << "," << posY << "], \"isPlayer\":" << isPlayer << "}";
            // std::cout << ShapeJSON.str();
            return ShapeJSON.str();
        }
};



int main() { 
    crow::SimpleApp app;
    app.loglevel(crow::LogLevel::Info);

    //Implementations could have only one route / socket with all traffic going between but it seems to me like many sockets not a big deal and seems cleaner
    //defo could have different implementations, depends on how ticks want to work, do both server and renderer tick, what are the intervals
    //Does only one tick and each tick prompt the other for an update? IDK right now configured for only js to tick and call for an update when it ticks
    //cuz it makes the c++ easier

    //For some implementaions coulg get away with not using websockets for everything, a good idea or is it less responsive becuz not constant connection? (or ddos)
    //Also async might be whack (aka prolly is, should all be sockets then)
    //Probably good for things that arn't called often at times you're allowed to wait not sure of use cases

    // Test Route
    // CROW_ROUTE(app, "/")
    //     .websocket()
    //     .onopen([&](crow::websocket::connection& conn){
    //         CROW_LOG_INFO << "new websocket connection";
    //     })
    //     .onclose([&](crow::websocket::connection& conn, const std::string& reason){
    //         CROW_LOG_INFO << "websocket connection closed: " << reason;
    //     })
    //     .onmessage([&](crow::websocket::connection& conn, const std::string& data, bool is_binary){
    //         std::cout << "Received message: " << data << "\n";
    //         if (is_binary)
    //             conn.send_binary(data);
    //         else
    //             conn.send_text(data);
    //     })
    // ;

    //Test Shapes
    Shape playerCircle;
    playerCircle.isNew = true;
    playerCircle.ID = "player";
    playerCircle.shape = "circle";
    playerCircle.dim = "{\"r\":10}";
    playerCircle.posX = 0;
    playerCircle.posY = 0;
    playerCircle.isPlayer = true;

    Shape stageTest;
    stageTest.isNew = true;
    stageTest.ID = "stage";
    stageTest.shape = "rectangle";
    stageTest.dim = "{\"width\":100, \"height\":25}";
    stageTest.posX = -50;
    stageTest.posY = 10;
    stageTest.isPlayer = false;

    //Gets the initial list of actors
    CROW_ROUTE(app, "/getActors")
        .websocket()
        .onopen([&](crow::websocket::connection& conn){ //Reset stuff on   socket reset, better answer exists
            CROW_LOG_INFO << "Actor Connection Open";

            playerCircle.isNew = true;
            playerCircle.ID = "player";
            playerCircle.shape = "circle";
            playerCircle.dim = "{\"r\":10}";
            playerCircle.posX = 0;
            playerCircle.posY = 0;
            playerCircle.isPlayer = true;


            stageTest.isNew = true;
            stageTest.ID = "stage";
            stageTest.shape = "rectangle";
            stageTest.dim = "{\"width\":100, \"height\":25}";
            stageTest.posX = -50;
            stageTest.posY = 10;
            stageTest.isPlayer = false;
        })
        .onclose([&](crow::websocket::connection& conn, const std::string& reason){
            CROW_LOG_INFO << "Actor Connection Closed: " << reason;
        })
        .onmessage([&](crow::websocket::connection& conn, const std::string& data, bool is_binary){ 
            conn.send_text(playerCircle.getJSON());
            conn.send_text(stageTest.getJSON());
            playerCircle.isNew = false;
            playerCircle.isNew = false;
        })
    ;


    //Not a good idea to send a request and an answer for each object every tick but its whats easy to code right now
    //Better ideas are 
    //   Array of Updated actor ids that have moved and their new positions
    CROW_ROUTE(app, "/getPosition")
        .websocket()
        .onopen([&](crow::websocket::connection& conn){
            CROW_LOG_INFO << "Pos Connection Open";
        })
        .onclose([&](crow::websocket::connection& conn, const std::string& reason){
            CROW_LOG_INFO << "Pos Connection Closed: " << reason;
        })
        .onmessage([&](crow::websocket::connection& conn, const std::string& data, bool is_binary){ 
            conn.send_text(playerCircle.getJSON());
            conn.send_text(stageTest.getJSON());
        })
    ;

    double speed = 1;

    CROW_ROUTE(app, "/sendInputs")
        .websocket()
        .onopen([&](crow::websocket::connection& conn){
            CROW_LOG_INFO << "Input Connection Open";
        })
        .onclose([&](crow::websocket::connection& conn, const std::string& reason){
            CROW_LOG_INFO << "Input Connection Closed: " << reason;
        })
        .onmessage([&](crow::websocket::connection& conn, const std::string& data, bool is_binary){ 
            if (data == "left") {
                playerCircle.posX = playerCircle.posX - speed;
            }
            if (data == "right") {
                playerCircle.posX = playerCircle.posX + speed;
            }
        })
    ;

    app.port(40800)
        .multithreaded()
        .run()
    ;
}